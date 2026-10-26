"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PackageStatus, PackageTier, type Package } from "@prisma/client";
import { prisma } from "../db";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { parseDateInput } from "../dates";
import { formatMoney, parseAmount } from "../money";
import { bookableIssues, DETAIL_KEYS, hasValue, linesToList, type DetailKey } from "../packages";
import { saveUpload } from "../uploads";
import { back, optStr, str } from "./util";

const path = (id: string) => `/admin/packages/${id}`;

function refresh(pkg: Pick<Package, "id" | "slug">) {
  revalidatePath("/", "layout");
  revalidatePath(path(pkg.id));
}

/** If a bookable package no longer meets requirements, demote it so nothing unverified is sold. */
async function enforceReadiness(pkg: Package, actorId: string): Promise<string | null> {
  if (pkg.status !== "BOOKABLE") return null;
  const issues = bookableIssues(pkg);
  if (issues.length === 0) return null;
  await prisma.package.update({ where: { id: pkg.id }, data: { status: "ENQUIRY" } });
  await audit(actorId, "package.auto_unpublished", "Package", pkg.id, { issues: issues.map((i) => i.message) });
  return " Booking requests have been closed and the package returned to “Enquire for Full Details” because: " +
    issues.map((i) => i.message).join(" ");
}

export async function createPackage(fd: FormData) {
  const me = await requireAdmin("ADMIN");
  const name = str(fd, "name");
  const tier = str(fd, "tier") as PackageTier;
  const price = parseAmount(str(fd, "price"));
  const slug = str(fd, "slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!name || !slug || !Object.values(PackageTier).includes(tier) || !price)
    back("/admin/packages/new", "error", "Name, URL slug, tier and a valid price are required.");
  if (await prisma.package.findUnique({ where: { slug } })) back("/admin/packages/new", "error", "That URL slug is already in use.");
  const pkg = await prisma.package.create({
    data: { name, slug, tier, price, currency: "NGN", status: "DRAFT", sortOrder: 99 },
  });
  await prisma.priceChange.create({
    data: { packageId: pkg.id, newPrice: price, currency: "NGN", reason: "Package created", changedById: me.id },
  });
  await audit(me.id, "package.created", "Package", pkg.id, { name, price });
  redirect(path(pkg.id) + "?ok=" + encodeURIComponent("Package created as a hidden draft."));
}

/** Saves the descriptive/operational fields and the per-field verification ticks. */
export async function savePackageDetails(id: string, fd: FormData) {
  const me = await requireAdmin("ADMIN");
  const before = await prisma.package.findUniqueOrThrow({ where: { id } });

  const departureDate = parseDateInput(fd.get("departureDate"));
  const returnDate = parseDateInput(fd.get("returnDate"));
  if (departureDate && returnDate && returnDate < departureDate) back(path(id), "error", "Return date cannot be before departure date.");
  const capacityRaw = str(fd, "capacity");
  const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;
  if (capacityRaw && (!Number.isInteger(capacity) || capacity! < 0)) back(path(id), "error", "Places offered must be a whole number.");

  const data = {
    name: str(fd, "name") || before.name,
    tagline: optStr(fd, "tagline"),
    description: optStr(fd, "description"),
    pricingBasis: optStr(fd, "pricingBasis"),
    priceValidFrom: parseDateInput(fd.get("priceValidFrom")),
    priceValidUntil: parseDateInput(fd.get("priceValidUntil")),
    season: optStr(fd, "season"),
    departureDate,
    returnDate,
    departureLocation: optStr(fd, "departureLocation"),
    accommodation: optStr(fd, "accommodation"),
    flights: optStr(fd, "flights"),
    groundTransport: optStr(fd, "groundTransport"),
    meals: optStr(fd, "meals"),
    visaAssistance: optStr(fd, "visaAssistance"),
    includedServices: linesToList(fd.get("includedServices")),
    excludedServices: linesToList(fd.get("excludedServices")),
    paymentSchedule: optStr(fd, "paymentSchedule"),
    cancellationTerms: optStr(fd, "cancellationTerms"),
    registrationOpens: parseDateInput(fd.get("registrationOpens")),
    registrationDeadline: parseDateInput(fd.get("registrationDeadline")),
    availabilityNote: optStr(fd, "availabilityNote"),
    capacity,
    sortOrder: Number.parseInt(str(fd, "sortOrder"), 10) || 0,
  };

  // Only keep a verification tick if the field actually has content.
  const merged = { ...before, ...data } as Package;
  const ticked = fd.getAll("verified").map(String).filter((k): k is DetailKey => (DETAIL_KEYS as string[]).includes(k));
  const verifiedFields = ticked.filter((k) => hasValue(merged, k));
  const droppedEmpty = ticked.filter((k) => !hasValue(merged, k));

  // Pricing basis / validity are part of what the price confirmation covers.
  const pricingChanged =
    before.pricingBasis !== data.pricingBasis ||
    before.priceValidUntil?.getTime() !== data.priceValidUntil?.getTime() ||
    before.priceValidFrom?.getTime() !== data.priceValidFrom?.getTime();

  const updated = await prisma.package.update({
    where: { id },
    data: {
      ...data,
      verifiedFields,
      ...(pricingChanged && before.priceConfirmedAt ? { priceConfirmedAt: null, priceConfirmedBy: null } : {}),
    },
  });

  const changed = Object.keys(data).filter((k) => JSON.stringify((before as Record<string, unknown>)[k]) !== JSON.stringify((data as Record<string, unknown>)[k]));
  const verifyAdded = verifiedFields.filter((k) => !before.verifiedFields.includes(k));
  const verifyRemoved = before.verifiedFields.filter((k) => !verifiedFields.includes(k as DetailKey));
  await audit(me.id, "package.details_updated", "Package", id, { changed, verifyAdded, verifyRemoved });

  let msg = "Package details saved.";
  if (droppedEmpty.length) msg += ` Verification was not applied to empty fields: ${droppedEmpty.join(", ")}.`;
  if (pricingChanged && before.priceConfirmedAt) msg += " Pricing basis or validity changed, so the price must be re-confirmed.";
  msg += (await enforceReadiness(updated, me.id)) ?? "";
  refresh(updated);
  back(path(id), "ok", msg);
}

/** Price changes are always explicit, require a reason and are recorded in history. */
export async function changePrice(id: string, fd: FormData) {
  const me = await requireAdmin("ADMIN");
  const before = await prisma.package.findUniqueOrThrow({ where: { id } });
  const price = parseAmount(str(fd, "price"));
  const reason = str(fd, "reason");
  if (!price) back(path(id), "error", "Enter a valid price (numbers only, e.g. 8700000).");
  if (reason.length < 3) back(path(id), "error", "Give a reason for the price change.");
  if (before.price.toString() === price || Number(before.price) === Number(price)) back(path(id), "error", "That is the current price.");
  if (str(fd, "confirmText") !== formatMoney(price, before.currency))
    back(path(id), "error", `To avoid mistakes, type the new price exactly as ${formatMoney(price, before.currency)} in the confirmation box.`);

  const updated = await prisma.package.update({
    where: { id },
    data: { price, priceConfirmedAt: null, priceConfirmedBy: null },
  });
  await prisma.priceChange.create({
    data: { packageId: id, oldPrice: before.price, newPrice: price, currency: before.currency, reason, changedById: me.id },
  });
  await audit(me.id, "package.price_changed", "Package", id, { from: before.price.toString(), to: price, reason });
  const extra = (await enforceReadiness(updated, me.id)) ?? "";
  refresh(updated);
  back(path(id), "ok", `Price changed to ${formatMoney(price, before.currency)}. Please confirm the price again before publishing as bookable.${extra}`);
}

export async function confirmPrice(id: string) {
  const me = await requireAdmin("ADMIN");
  const pkg = await prisma.package.findUniqueOrThrow({ where: { id } });
  if (!pkg.pricingBasis || !pkg.priceValidUntil)
    back(path(id), "error", "Enter the pricing basis and price validity date before confirming the price.");
  await prisma.package.update({ where: { id }, data: { priceConfirmedAt: new Date(), priceConfirmedBy: me.name } });
  await audit(me.id, "package.price_confirmed", "Package", id, {
    price: pkg.price.toString(), currency: pkg.currency, pricingBasis: pkg.pricingBasis, validUntil: pkg.priceValidUntil,
  });
  refresh(pkg);
  back(path(id), "ok", `Price of ${formatMoney(pkg.price, pkg.currency)} confirmed.`);
}

export async function unconfirmPrice(id: string) {
  const me = await requireAdmin("ADMIN");
  const pkg = await prisma.package.update({ where: { id }, data: { priceConfirmedAt: null, priceConfirmedBy: null } });
  await audit(me.id, "package.price_unconfirmed", "Package", id);
  const extra = (await enforceReadiness(pkg, me.id)) ?? "";
  refresh(pkg);
  back(path(id), "ok", "Price confirmation withdrawn." + extra);
}

export async function setPackageStatus(id: string, fd: FormData) {
  const me = await requireAdmin("ADMIN");
  const status = str(fd, "status") as PackageStatus;
  if (!Object.values(PackageStatus).includes(status)) back(path(id), "error", "Unknown status.");
  const pkg = await prisma.package.findUniqueOrThrow({ where: { id } });
  if (status === "BOOKABLE") {
    const issues = bookableIssues(pkg);
    if (issues.length) back(path(id), "error", "Cannot publish as bookable yet: " + issues.map((i) => i.message).join(" "));
  }
  await prisma.package.update({ where: { id }, data: { status } });
  await audit(me.id, "package.status_changed", "Package", id, { from: pkg.status, to: status });
  refresh(pkg);
  back(path(id), "ok", "Status updated.");
}

// ---- media, brochures, FAQs ------------------------------------------------

export async function addImage(id: string, fd: FormData) {
  const me = await requireAdmin("ADMIN");
  const file = fd.get("file");
  const alt = str(fd, "alt");
  if (!(file instanceof File) || file.size === 0) back(path(id) + "#media", "error", "Choose an image to upload.");
  if (!alt) back(path(id) + "#media", "error", "Describe the photo (alt text) for accessibility.");
  let url: string;
  try {
    url = await saveUpload(file as File, "image");
  } catch (e) {
    back(path(id) + "#media", "error", (e as Error).message);
  }
  const count = await prisma.packageImage.count({ where: { packageId: id } });
  await prisma.packageImage.create({ data: { packageId: id, url, alt, sortOrder: count } });
  await audit(me.id, "package.image_added", "Package", id, { url });
  refresh({ id, slug: "" });
  back(path(id) + "#media", "ok", "Photo added.");
}

export async function deleteImage(id: string, imageId: string) {
  const me = await requireAdmin("ADMIN");
  await prisma.packageImage.delete({ where: { id: imageId, packageId: id } });
  await audit(me.id, "package.image_removed", "Package", id, { imageId });
  refresh({ id, slug: "" });
  back(path(id) + "#media", "ok", "Photo removed.");
}

export async function addDocument(id: string, fd: FormData) {
  const me = await requireAdmin("ADMIN");
  const file = fd.get("file");
  const title = str(fd, "title");
  if (!(file instanceof File) || file.size === 0 || !title) back(path(id) + "#media", "error", "Provide a title and a PDF file.");
  let url: string;
  try {
    url = await saveUpload(file as File, "document");
  } catch (e) {
    back(path(id) + "#media", "error", (e as Error).message);
  }
  await prisma.packageDocument.create({ data: { packageId: id, title, url } });
  await audit(me.id, "package.brochure_added", "Package", id, { title, url });
  refresh({ id, slug: "" });
  back(path(id) + "#media", "ok", "Brochure added.");
}

export async function deleteDocument(id: string, docId: string) {
  const me = await requireAdmin("ADMIN");
  await prisma.packageDocument.delete({ where: { id: docId, packageId: id } });
  await audit(me.id, "package.brochure_removed", "Package", id, { docId });
  refresh({ id, slug: "" });
  back(path(id) + "#media", "ok", "Brochure removed.");
}

export async function addFaq(id: string, fd: FormData) {
  const me = await requireAdmin("ADMIN");
  const question = str(fd, "question");
  const answer = str(fd, "answer");
  if (!question || !answer) back(path(id) + "#faqs", "error", "Enter both a question and an answer.");
  const count = await prisma.packageFaq.count({ where: { packageId: id } });
  await prisma.packageFaq.create({ data: { packageId: id, question, answer, sortOrder: count, published: fd.get("published") === "on" } });
  await audit(me.id, "package.faq_added", "Package", id, { question });
  refresh({ id, slug: "" });
  back(path(id) + "#faqs", "ok", "FAQ added.");
}

export async function toggleFaq(id: string, faqId: string) {
  await requireAdmin("ADMIN");
  const faq = await prisma.packageFaq.findUniqueOrThrow({ where: { id: faqId, packageId: id } });
  await prisma.packageFaq.update({ where: { id: faqId }, data: { published: !faq.published } });
  refresh({ id, slug: "" });
  back(path(id) + "#faqs", "ok", faq.published ? "FAQ hidden." : "FAQ published.");
}

export async function deleteFaq(id: string, faqId: string) {
  const me = await requireAdmin("ADMIN");
  await prisma.packageFaq.delete({ where: { id: faqId, packageId: id } });
  await audit(me.id, "package.faq_removed", "Package", id, { faqId });
  refresh({ id, slug: "" });
  back(path(id) + "#faqs", "ok", "FAQ removed.");
}
