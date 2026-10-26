import Link from "next/link";

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div
      role="status"
      className={`mb-6 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-pine-600/20 bg-pine-50 text-pine-900"}`}
    >
      {error ?? ok}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && <Link href={back.href} className="text-sm text-stone hover:text-pine-700">← {back.label}</Link>}
        <h1 className="mt-1 font-serif text-4xl font-semibold text-pine-900">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-stone">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const PILL: Record<string, string> = {
  green: "bg-pine-50 text-pine-800 ring-pine-700/20",
  gold: "bg-gold-100 text-gold-700 ring-gold-500/30",
  grey: "bg-stone/10 text-ink/70 ring-ink/10",
  red: "bg-red-50 text-red-800 ring-red-700/20",
  blue: "bg-sky-50 text-sky-800 ring-sky-700/20",
};

export function Pill({ tone = "grey", children }: { tone?: keyof typeof PILL; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PILL[tone]}`}>{children}</span>;
}

export const BOOKING_TONE: Record<string, keyof typeof PILL> = {
  REQUESTED: "gold", UNDER_REVIEW: "blue", AWAITING_DEPOSIT: "blue", CONFIRMED: "green", WAITLISTED: "grey", CANCELLED: "red", COMPLETED: "grey",
};
export const INQUIRY_TONE: Record<string, keyof typeof PILL> = {
  NEW: "gold", CONTACTED: "blue", IN_PROGRESS: "blue", CONVERTED: "green", CLOSED: "grey",
};
export const PACKAGE_TONE: Record<string, keyof typeof PILL> = {
  DRAFT: "grey", ENQUIRY: "gold", COMING_SOON: "blue", BOOKABLE: "green", ARCHIVED: "grey",
};

export function Card({ title, children, actions, className = "" }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={`card p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-serif text-xl font-semibold text-pine-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-stone">{children}</p>;
}

export const humanize = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
