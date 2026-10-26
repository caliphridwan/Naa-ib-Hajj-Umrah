import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./storage/uploads");

export const ALLOWED = {
  image: { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" },
  document: { "application/pdf": ".pdf" },
} as const;

const MAX_BYTES = 10 * 1024 * 1024;

export async function saveUpload(file: File, kind: keyof typeof ALLOWED): Promise<string> {
  const types = ALLOWED[kind] as Record<string, string>;
  const ext = types[file.type];
  if (!ext) throw new Error(kind === "image" ? "Images must be JPEG, PNG or WebP." : "Brochures must be PDF files.");
  if (file.size > MAX_BYTES) throw new Error("File is larger than 10 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  // Check magic bytes rather than trusting the browser-supplied type.
  const sig = buf.subarray(0, 12);
  const ok =
    (ext === ".jpg" && sig[0] === 0xff && sig[1] === 0xd8) ||
    (ext === ".png" && sig.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) ||
    (ext === ".webp" && sig.subarray(0, 4).toString() === "RIFF" && sig.subarray(8, 12).toString() === "WEBP") ||
    (ext === ".pdf" && sig.subarray(0, 5).toString() === "%PDF-");
  if (!ok) throw new Error("File contents do not match its type.");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/files/${name}`;
}
