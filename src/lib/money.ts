import type { Prisma } from "@prisma/client";

type Amount = Prisma.Decimal | number | string;

/** Formats an amount exactly — never rounds a stored price. */
export function formatMoney(amount: Amount, currency = "NGN"): string {
  const value = typeof amount === "object" ? amount.toString() : String(amount);
  const [whole, frac = ""] = value.split(".");
  const negative = whole.startsWith("-");
  const digits = negative ? whole.slice(1) : whole;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = frac.replace(/0+$/, "");
  const symbol = currency === "NGN" ? "₦" : `${currency} `;
  return `${negative ? "-" : ""}${symbol}${grouped}${cents ? "." + frac.padEnd(2, "0").slice(0, 2) : ""}`;
}

/** Parses a user-entered amount like "8,700,000" or "₦8700000.50". Returns null if invalid. */
export function parseAmount(input: string): string | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(cleaned)) return null;
  return cleaned;
}
