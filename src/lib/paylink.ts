import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Personal, unguessable payment link per booking — no customer account needed.
// The token is an HMAC of the booking reference, so it can't be forged and
// never needs storing.
function sign(ref: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(`pay:${ref}`).digest("base64url").slice(0, 22);
}

export function payToken(ref: string) {
  return sign(ref);
}

export function validPayToken(ref: string, token: string | null | undefined) {
  if (!token) return false;
  const a = Buffer.from(sign(ref));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Path of the customer's private booking & payment page. */
export function payPath(ref: string) {
  return `/pay/${encodeURIComponent(ref)}?t=${payToken(ref)}`;
}

/** Absolute link for emails and for staff to share (e.g. on WhatsApp). */
export function payUrl(ref: string) {
  return `${(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}${payPath(ref)}`;
}
