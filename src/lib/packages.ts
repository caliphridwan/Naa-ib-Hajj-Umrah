import type { Package, PackageStatus, PackageTier } from "@prisma/client";

/**
 * Verifiable package information. Each key can be marked "verified" by an
 * administrator; only verified keys are presented publicly as confirmed.
 */
export const DETAIL_FIELDS = [
  { key: "description", label: "Package description", group: "Overview" },
  { key: "pricingBasis", label: "Pricing basis", group: "Pricing" },
  { key: "priceValidity", label: "Price validity", group: "Pricing" },
  { key: "season", label: "Applicable Hajj season", group: "Season & dates" },
  { key: "dates", label: "Departure and return dates", group: "Season & dates" },
  { key: "departureLocation", label: "Departure location", group: "Season & dates" },
  { key: "accommodation", label: "Accommodation", group: "Arrangements" },
  { key: "flights", label: "Flight arrangements", group: "Arrangements" },
  { key: "groundTransport", label: "Ground transportation", group: "Arrangements" },
  { key: "meals", label: "Meals", group: "Arrangements" },
  { key: "visaAssistance", label: "Visa / permit assistance", group: "Arrangements" },
  { key: "included", label: "Included services", group: "Inclusions" },
  { key: "excluded", label: "Excluded services", group: "Inclusions" },
  { key: "paymentSchedule", label: "Payment schedule", group: "Terms" },
  { key: "cancellationTerms", label: "Cancellation and refund terms", group: "Terms" },
  { key: "registration", label: "Registration window", group: "Availability" },
  { key: "availability", label: "Availability", group: "Availability" },
] as const;

export type DetailKey = (typeof DETAIL_FIELDS)[number]["key"];
export const DETAIL_KEYS = DETAIL_FIELDS.map((f) => f.key) as DetailKey[];

/** Required (and verified) before a package can be published as a bookable quotation. */
export const BOOKABLE_REQUIREMENTS: DetailKey[] = [
  "pricingBasis",
  "priceValidity",
  "season",
  "dates",
  "departureLocation",
  "included",
  "excluded",
  "paymentSchedule",
  "cancellationTerms",
];

export function hasValue(p: Package, key: DetailKey): boolean {
  switch (key) {
    case "priceValidity":
      return !!p.priceValidUntil;
    case "dates":
      return !!p.departureDate && !!p.returnDate;
    case "included":
      return p.includedServices.length > 0;
    case "excluded":
      return p.excludedServices.length > 0;
    case "registration":
      return !!p.registrationDeadline;
    case "availability":
      return !!p.availabilityNote || p.capacity != null;
    default:
      return !!(p[key] as string | null)?.trim();
  }
}

export function isVerified(p: Package, key: DetailKey): boolean {
  return p.verifiedFields.includes(key) && hasValue(p, key);
}

export type ReadinessIssue = { key: string; message: string };

/** Everything that must be true for a package to be a final, bookable quotation. */
export function bookableIssues(p: Package, now = new Date()): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  if (!p.priceConfirmedAt) issues.push({ key: "price", message: "Price has not been confirmed by an administrator." });
  for (const key of BOOKABLE_REQUIREMENTS) {
    const label = DETAIL_FIELDS.find((f) => f.key === key)!.label;
    if (!hasValue(p, key)) issues.push({ key, message: `${label} is not entered.` });
    else if (!p.verifiedFields.includes(key)) issues.push({ key, message: `${label} is entered but not verified.` });
  }
  if (p.priceValidUntil && p.priceValidUntil < now) issues.push({ key: "priceValidity", message: "Price validity date has passed." });
  if (p.registrationDeadline && p.registrationDeadline < now)
    issues.push({ key: "registration", message: "Registration deadline has passed." });
  if (p.departureDate && p.returnDate && p.returnDate < p.departureDate)
    issues.push({ key: "dates", message: "Return date is before departure date." });
  return issues;
}

export const PUBLIC_STATUSES: PackageStatus[] = ["ENQUIRY", "COMING_SOON", "BOOKABLE"];

export const STATUS_LABEL: Record<PackageStatus, string> = {
  DRAFT: "Draft (hidden)",
  ENQUIRY: "Enquire for Full Details",
  COMING_SOON: "Registration Details Coming Soon",
  BOOKABLE: "Bookable — confirmed quotation",
  ARCHIVED: "Archived (hidden)",
};

/** Public-facing status line. */
export function publicStatusLabel(p: Package): string {
  if (p.status === "BOOKABLE") return "Registration open";
  if (p.status === "COMING_SOON") return "Registration Details Coming Soon";
  return "Full details on enquiry";
}

export const TIER_LABEL: Record<PackageTier, string> = {
  REGULAR: "Regular",
  STANDARD: "Standard",
  VIP: "VIP",
};

/** A fully confirmed, published quotation (every required detail verified). */
export function isConfirmedQuotation(p: Package, now = new Date()) {
  return p.status === "BOOKABLE" && bookableIssues(p, now).length === 0;
}

/**
 * Booking requests are accepted for every package visible to the public,
 * including ones whose details are still being confirmed. A request never
 * secures a place: staff review it and confirm the total before any payment.
 */
export function canRequestBooking(p: Package, now = new Date()) {
  if (!PUBLIC_STATUSES.includes(p.status)) return false;
  if (p.registrationDeadline && p.registrationDeadline < now) return false;
  return p.status !== "BOOKABLE" || bookableIssues(p, now).length === 0;
}

export function linesToList(v: FormDataEntryValue | null): string[] {
  if (typeof v !== "string") return [];
  return v
    .split("\n")
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}
