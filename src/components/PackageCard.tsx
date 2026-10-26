import Link from "next/link";
import type { Package } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { canRequestBooking, isVerified, publicStatusLabel, TIER_LABEL } from "@/lib/packages";

const TIER_STYLE = {
  REGULAR: {
    card: "bg-white border border-pine-900/12",
    eyebrow: "text-pine-600",
    title: "text-pine-900",
    body: "text-ink/75",
    rule: "bg-pine-900/10",
    badge: "bg-pine-50 text-pine-800",
    primary: "btn-primary",
    secondary: "btn-outline",
  },
  STANDARD: {
    card: "bg-pine-50 border-2 border-pine-700/40",
    eyebrow: "text-pine-700",
    title: "text-pine-900",
    body: "text-ink/75",
    rule: "bg-pine-700/20",
    badge: "bg-white text-pine-800",
    primary: "btn-primary",
    secondary: "btn-outline",
  },
  VIP: {
    card: "bg-pine-950 border border-gold-500/50 text-ivory shadow-xl shadow-pine-950/20",
    eyebrow: "text-gold-300",
    title: "text-ivory",
    body: "text-ivory/75",
    rule: "bg-gold-500/30",
    badge: "bg-gold-500/15 text-gold-300",
    primary: "btn-gold",
    secondary: "btn border border-ivory/25 text-ivory hover:bg-ivory/10",
  },
} as const;

export function PackageCard({ pkg, delay = 0 }: { pkg: Package; delay?: number }) {
  const t = TIER_STYLE[pkg.tier];
  const facts: [string, string][] = [];
  if (isVerified(pkg, "season")) facts.push(["Season", pkg.season!]);
  if (isVerified(pkg, "dates")) facts.push(["Departs", formatDate(pkg.departureDate)]);
  if (isVerified(pkg, "departureLocation")) facts.push(["From", pkg.departureLocation!]);
  if (isVerified(pkg, "registration")) facts.push(["Register by", formatDate(pkg.registrationDeadline)]);

  return (
    <article
      className={`lift relative flex flex-col overflow-hidden rounded-3xl p-7 ${pkg.tier === "VIP" ? "sheen" : ""} ${t.card}`}
      data-reveal
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      {pkg.tier === "VIP" && <div className="pattern-stars pattern-drift pointer-events-none absolute inset-0 opacity-40" aria-hidden />}
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <p className={`eyebrow ${t.eyebrow}`}>{TIER_LABEL[pkg.tier]} Hajj</p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${t.badge}`}>{publicStatusLabel(pkg)}</span>
        </div>
        <h3 className={`mt-3 font-serif text-3xl font-semibold ${t.title}`}>{pkg.name}</h3>
        {pkg.tagline && <p className={`mt-2 text-sm ${t.body}`}>{pkg.tagline}</p>}

        <div className={`my-6 h-px ${t.rule}`} />

        <p className={`text-xs uppercase tracking-wider ${t.body}`}>Starting price</p>
        <p className={`mt-1 font-serif text-4xl font-semibold ${t.title}`}>{formatMoney(pkg.price, pkg.currency)}</p>
        <p className={`mt-1 text-xs ${t.body}`}>
          {isVerified(pkg, "pricingBasis") ? pkg.pricingBasis : "Pricing basis to be confirmed on enquiry"}
        </p>

        {facts.length > 0 && (
          <dl className="mt-5 space-y-1.5 text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className={t.body}>{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className={`mt-4 text-xs ${t.body}`}>Instalment payments available after booking approval.</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          {canRequestBooking(pkg) && (
            <Link href={`/packages/${pkg.slug}/book`} className={t.primary}>
              Book Now
            </Link>
          )}
          <Link href={`/packages/${pkg.slug}`} className={t.secondary}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
