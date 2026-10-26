import { cache } from "react";
import { prisma } from "./db";

export type Art = "makkah" | "madinah";

/** Every photo position on the public site. Empty slots show an illustration instead. */
export const PHOTO_SLOTS = [
  { slot: "hero", label: "Home page — main banner", hint: "Wide landscape photo, e.g. the Kaaba and Masjid al-Haram. At least 1920px wide.", art: "makkah" },
  { slot: "makkah", label: "Makkah — Masjid al-Haram", hint: "The Kaaba or Masjid al-Haram.", art: "makkah" },
  { slot: "madinah", label: "Madinah — Masjid an-Nabawi", hint: "The Prophet's Mosque, e.g. the Green Dome or the courtyard umbrellas.", art: "madinah" },
  { slot: "guide", label: "Hajj Guide page — banner", hint: "e.g. pilgrims at Mount Arafat or the tents of Mina.", art: "makkah" },
  { slot: "gallery-1", label: "Gallery photo 1", hint: "", art: "makkah" },
  { slot: "gallery-2", label: "Gallery photo 2", hint: "", art: "madinah" },
  { slot: "gallery-3", label: "Gallery photo 3", hint: "", art: "makkah" },
  { slot: "gallery-4", label: "Gallery photo 4", hint: "", art: "madinah" },
  { slot: "gallery-5", label: "Gallery photo 5", hint: "", art: "makkah" },
  { slot: "gallery-6", label: "Gallery photo 6", hint: "", art: "madinah" },
] as const satisfies readonly { slot: string; label: string; hint: string; art: Art }[];

export type SlotName = (typeof PHOTO_SLOTS)[number]["slot"];

export const getSitePhotos = cache(async () => {
  const rows = await prisma.sitePhoto.findMany();
  return Object.fromEntries(rows.map((r) => [r.slot, r])) as Partial<Record<SlotName, (typeof rows)[number]>>;
});
