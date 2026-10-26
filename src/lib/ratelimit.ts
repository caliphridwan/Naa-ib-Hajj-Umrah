import "server-only";
import { headers } from "next/headers";

// Simple in-memory limiter for public forms. Replace with a shared store
// (e.g. Redis) if the app runs on more than one instance.
const hits = new Map<string, number[]>();

export async function rateLimit(bucket: string, max: number, windowMs: number): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}
