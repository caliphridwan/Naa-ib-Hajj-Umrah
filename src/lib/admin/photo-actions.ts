"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { saveUpload } from "../uploads";
import { PHOTO_SLOTS } from "../site-photos";
import { back, optStr, str } from "./util";

const PAGE = "/admin/site-photos";

export async function saveSitePhoto(slot: string, fd: FormData) {
  const me = await requireAdmin("ADMIN");
  if (!PHOTO_SLOTS.some((s) => s.slot === slot)) back(PAGE, "error", "Unknown photo position.");
  const existing = await prisma.sitePhoto.findUnique({ where: { slot } });
  const file = fd.get("file");
  const alt = str(fd, "alt");
  const credit = optStr(fd, "credit");
  const creditUrl = optStr(fd, "creditUrl");
  const hasFile = file instanceof File && file.size > 0;
  const anchor = `${PAGE}#${slot}`;

  if (!hasFile && !existing) back(anchor, "error", "Choose a photo to upload.");
  if (!alt) back(anchor, "error", "Describe the photo (used by screen readers and search engines).");
  if (creditUrl && !/^https:\/\//.test(creditUrl)) back(anchor, "error", "Credit link must start with https://");
  if (fd.get("rights") !== "on") back(anchor, "error", "Please confirm the company has the right to use this photo.");

  let url = existing?.url ?? "";
  if (hasFile) {
    try {
      url = await saveUpload(file as File, "image");
    } catch (e) {
      back(anchor, "error", (e as Error).message);
    }
  }
  await prisma.sitePhoto.upsert({
    where: { slot },
    update: { url, alt, credit, creditUrl },
    create: { slot, url, alt, credit, creditUrl },
  });
  await audit(me.id, "site_photo.saved", "SitePhoto", slot, { url, credit });
  revalidatePath("/", "layout");
  back(anchor, "ok", "Photo saved. It now appears on the website.");
}

export async function removeSitePhoto(slot: string) {
  const me = await requireAdmin("ADMIN");
  await prisma.sitePhoto.deleteMany({ where: { slot } });
  await audit(me.id, "site_photo.removed", "SitePhoto", slot);
  revalidatePath("/", "layout");
  back(`${PAGE}#${slot}`, "ok", "Photo removed. The illustration is shown instead.");
}
