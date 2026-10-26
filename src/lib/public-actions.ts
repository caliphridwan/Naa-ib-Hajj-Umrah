"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CustomerType, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { newBookingRef, newInquiryRef, newOnlinePaymentRef } from "./refs";
import { sendCustomerEmail } from "./mail";
import { canRequestBooking, isVerified, linesToList } from "./packages";
import { formatMoney, parseAmount } from "./money";
import { rateLimit } from "./ratelimit";
import { getSettings } from "./settings";
import { initializeTransaction, paystackEnabled } from "./paystack";
import { payPath, payUrl, validPayToken } from "./paylink";
import { GATEWAY_MIN_NGN, PAYABLE_STATUSES, summarisePayments } from "./payments";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | undefined;

const phone = z.string().trim().min(7, "Enter a valid phone number").max(30).regex(/^[+\d\s()-]+$/, "Enter a valid phone number");

const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(160),
  phone,
  type: z.nativeEnum(CustomerType),
  organisationName: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
});

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

function obj(fd: FormData) {
  const o: Record<string, string> = {};
  fd.forEach((v, k) => { if (typeof v === "string") o[k] = v; });
  return o;
}

async function upsertCustomer(c: z.infer<typeof contactSchema>) {
  const existing = await prisma.customer.findFirst({ where: { email: c.email }, orderBy: { createdAt: "asc" } });
  if (existing) {
    return prisma.customer.update({
      where: { id: existing.id },
      data: { phone: c.phone, organisationName: c.organisationName || existing.organisationName, city: c.city || existing.city },
    });
  }
  return prisma.customer.create({
    data: { fullName: c.fullName, email: c.email, phone: c.phone, type: c.type, organisationName: c.organisationName || null, city: c.city || null },
  });
}

const inquirySchema = contactSchema.extend({
  packageSlug: z.string().optional(),
  travellersCount: z.coerce.number().int().min(1, "At least 1").max(1000),
  preferredContact: z.enum(["phone", "email", "whatsapp"]).optional(),
  message: z.string().trim().min(5, "Tell us a little about your enquiry").max(4000),
  consent: z.literal("on", { errorMap: () => ({ message: "Please confirm so we can contact you" }) }),
});

export async function submitInquiry(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = obj(fd);
  if (fd.get("website")) return { error: "Unable to submit." }; // honeypot
  if (!(await rateLimit("inquiry", 5, 10 * 60_000))) return { error: "Too many submissions. Please try again in a few minutes.", values };

  const parsed = inquirySchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  const d = parsed.data;
  if ((d.type === "GROUP" || d.type === "INSTITUTION") && !d.organisationName)
    return { error: "Please check the highlighted fields.", fieldErrors: { organisationName: "Enter the group or organisation name" }, values };

  const pkg = d.packageSlug ? await prisma.package.findUnique({ where: { slug: d.packageSlug } }) : null;
  const customer = await upsertCustomer(d);
  const inquiry = await prisma.inquiry.create({
    data: {
      reference: newInquiryRef(),
      customerId: customer.id,
      packageId: pkg?.id,
      inquiryType: d.type,
      travellersCount: d.travellersCount,
      preferredContact: d.preferredContact,
      message: d.message,
      consentGiven: true,
    },
  });

  await sendCustomerEmail({
    to: customer.email,
    customerId: customer.id,
    context: `inquiry:${inquiry.reference}`,
    subject: `We have received your enquiry (${inquiry.reference})`,
    body: [
      `Assalamu alaikum ${d.fullName},`,
      "",
      `Thank you for contacting us. Your enquiry reference is ${inquiry.reference}.`,
      pkg ? `Package of interest: ${pkg.name} (starting price ${formatMoney(pkg.price, pkg.currency)}).` : null,
      "",
      "A member of our team will review your enquiry and contact you. Please note that an enquiry does not reserve a Hajj place.",
    ].filter((l) => l !== null).join("\n"),
  });

  redirect(`/enquire/received?ref=${inquiry.reference}`);
}

const bookingSchema = contactSchema.extend({
  packageSlug: z.string(),
  travellersCount: z.coerce.number().int().min(1).max(500),
  travellerNames: z.string().trim().min(2, "List the name of each traveller"),
  specialRequests: z.string().trim().max(4000).optional(),
  ackNotConfirmed: z.literal("on", { errorMap: () => ({ message: "Please confirm you understand" }) }),
  ackPrice: z.literal("on", { errorMap: () => ({ message: "Please confirm you have read the price information" }) }),
  consent: z.literal("on", { errorMap: () => ({ message: "Please confirm so we can contact you" }) }),
});

export async function submitBookingRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = obj(fd);
  if (fd.get("website")) return { error: "Unable to submit." };
  if (!(await rateLimit("booking", 5, 10 * 60_000))) return { error: "Too many submissions. Please try again in a few minutes.", values };

  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  const d = parsed.data;

  const names = linesToList(d.travellerNames);
  if (names.length !== d.travellersCount)
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: { travellerNames: `You entered ${names.length} name(s) for ${d.travellersCount} traveller(s).` },
      values,
    };

  const pkg = await prisma.package.findUnique({ where: { slug: d.packageSlug } });
  if (!pkg || !canRequestBooking(pkg))
    return { error: "Booking requests for this package are closed. Please send us an enquiry instead.", values };

  const customer = await upsertCustomer(d);
  const booking = await prisma.booking.create({
    data: {
      reference: newBookingRef(),
      customerId: customer.id,
      packageId: pkg.id,
      travellersCount: d.travellersCount,
      unitPrice: pkg.price,
      currency: pkg.currency,
      pricingBasis: isVerified(pkg, "pricingBasis") ? pkg.pricingBasis : null,
      season: isVerified(pkg, "season") ? pkg.season : null,
      specialRequests: d.specialRequests || null,
      consentGiven: true,
      travellers: { create: names.map((fullName, i) => ({ fullName, isLead: i === 0 })) },
    },
  });

  const s = await getSettings();
  await sendCustomerEmail({
    to: customer.email,
    customerId: customer.id,
    context: `booking:${booking.reference}`,
    subject: `Booking request received (${booking.reference})`,
    body: [
      `Assalamu alaikum ${d.fullName},`,
      "",
      `Thank you for choosing ${s.displayName}. We have received your booking request.`,
      "",
      `Reference: ${booking.reference}`,
      `Package: ${pkg.name}${isVerified(pkg, "season") ? ` — ${pkg.season}` : ""}`,
      `Starting price: ${formatMoney(pkg.price, pkg.currency)}${isVerified(pkg, "pricingBasis") ? ` (${pkg.pricingBasis})` : ""}`,
      `Travellers: ${d.travellersCount}`,
      "",
      "IMPORTANT: This is a booking request, not a confirmation. Your Hajj place is not secured until our team",
      "has reviewed your request and confirmed the package details and your total amount with you.",
      "",
      "Your private booking & payment page (no account or password needed — keep this link safe):",
      payUrl(booking.reference),
      "",
      "Once your booking is approved, you can pay there in full or in instalments with Paystack, and see your",
      "percentage paid, balance and receipts at any time.",
    ].join("\n"),
  });

  redirect(`${payPath(booking.reference)}&new=1`);
}

/**
 * Starts a Paystack checkout for an instalment. The customer chooses the
 * amount (between the minimum and the outstanding balance). Nothing is
 * recorded as paid until Paystack confirms the transaction.
 */
export async function startOnlinePayment(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = obj(fd);
  if (!paystackEnabled()) return { error: "Online payment is not available yet. Please contact our team for payment instructions.", values };
  if (!(await rateLimit("pay", 10, 10 * 60_000))) return { error: "Too many attempts. Please try again in a few minutes.", values };

  const ref = (values.ref ?? "").trim().toUpperCase();
  if (!validPayToken(ref, values.t)) return { error: "This payment link is not valid. Please use the link from your email.", values };
  const booking = await prisma.booking.findUnique({ where: { reference: ref }, include: { customer: true, payments: true } });
  if (!booking) return { error: "Booking not found.", values };
  if (!PAYABLE_STATUSES.includes(booking.status) || !booking.agreedTotal)
    return { error: "This booking is not yet open for payment. Our team will let you know when it is.", values };

  const s = summarisePayments(booking.agreedTotal, booking.payments);
  if (!s.balance || s.balance.lte(0)) return { error: "This booking is fully paid. Thank you.", values };

  const raw = parseAmount(values.amount ?? "");
  if (!raw) return { error: "Please check the amount.", fieldErrors: { amount: "Enter an amount in Naira, e.g. 500000" }, values };
  const amount = new Prisma.Decimal(raw);

  const settings = await getSettings();
  const companyMin = settings.minOnlineInstalment ?? GATEWAY_MIN_NGN;
  // Paying off the whole remaining balance is always allowed, even below the company minimum.
  const minimum = Prisma.Decimal.min(Prisma.Decimal.max(companyMin, GATEWAY_MIN_NGN), s.balance);
  if (amount.lt(minimum))
    return { error: "Please check the amount.", fieldErrors: { amount: `The minimum online payment is ${formatMoney(minimum, booking.currency)}.` }, values };
  if (amount.gt(s.balance))
    return { error: "Please check the amount.", fieldErrors: { amount: `The outstanding balance is ${formatMoney(s.balance, booking.currency)}.` }, values };
  if (booking.currency !== "NGN") return { error: "Online payment is only available for Naira bookings.", values };

  const amountKobo = BigInt(amount.mul(100).toFixed(0));
  const reference = newOnlinePaymentRef();
  await prisma.onlinePaymentAttempt.create({ data: { reference, bookingId: booking.id, amountKobo, currency: booking.currency } });

  const h = await headers();
  const origin = process.env.APP_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  let url: string;
  try {
    const init = await initializeTransaction({
      email: booking.customer.email,
      amountKobo,
      reference,
      callbackUrl: `${origin}/payments/paystack/callback`,
      metadata: { bookingReference: booking.reference, customer: booking.customer.fullName },
    });
    url = init.authorization_url;
  } catch (e) {
    await prisma.onlinePaymentAttempt.update({ where: { reference }, data: { status: "FAILED", gatewayMessage: (e as Error).message } });
    return { error: "We could not start the payment with Paystack. Please try again shortly.", values };
  }
  redirect(url);
}
