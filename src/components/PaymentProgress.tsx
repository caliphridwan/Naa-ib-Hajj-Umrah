import type { PaymentSummary } from "@/lib/payments";
import { formatMoney } from "@/lib/money";

/** Progress bar with paid / outstanding amounts and percentages. Used by customers and staff. */
export function PaymentProgress({ summary: s, currency }: { summary: PaymentSummary; currency: string }) {
  if (!s.total) {
    return (
      <p className="rounded-lg bg-sand/60 p-4 text-sm text-ink/80">
        The total amount for this booking has not been finalised yet. Payments received so far:{" "}
        <strong>{formatMoney(s.paid, currency)}</strong>.
      </p>
    );
  }
  const pct = s.percentPaid ?? 0;
  const remaining = Math.max(0, Math.round((100 - pct) * 10) / 10);
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone">Paid</p>
          <p className="font-serif text-3xl font-semibold text-pine-800">{pct}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-stone">Yet to be paid</p>
          <p className="font-serif text-3xl font-semibold text-gold-700">{remaining}%</p>
        </div>
      </div>
      <div
        className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gold-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Percentage of booking paid"
      >
        <div className="bar-fill h-full rounded-full bg-gradient-to-r from-pine-700 to-pine-600" style={{ width: `${pct}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div><dt className="text-stone">Total</dt><dd className="font-medium">{formatMoney(s.total, currency)}</dd></div>
        <div><dt className="text-stone">Paid</dt><dd className="font-medium text-pine-800">{formatMoney(s.paid, currency)}</dd></div>
        <div><dt className="text-stone">Balance</dt><dd className="font-medium text-gold-700">{formatMoney(s.balance ?? 0, currency)}</dd></div>
      </dl>
      {s.overpaid && <p className="mt-2 text-xs text-red-800">Payments exceed the agreed total by {formatMoney(s.overpaid, currency)}. Our team will contact you.</p>}
      {pct >= 100 && !s.overpaid && <p className="mt-2 text-sm font-medium text-pine-700">Fully paid — thank you.</p>}
    </div>
  );
}
