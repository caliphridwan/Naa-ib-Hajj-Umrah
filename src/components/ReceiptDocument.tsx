import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { summarisePayments } from "@/lib/payments";
import { Logo } from "./Logo";

const METHOD: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer", CASH: "Cash", POS: "POS", CHEQUE: "Cheque", PAYSTACK: "Online (Paystack)", OTHER: "Other",
};

export async function loadReceipt(where: { paymentId?: string; receiptNumber?: string; bookingId?: string; bookingRef?: string; email?: string }) {
  return prisma.payment.findFirst({
    where: {
      ...(where.paymentId ? { id: where.paymentId } : {}),
      ...(where.receiptNumber ? { receiptNumber: where.receiptNumber } : {}),
      ...(where.bookingId ? { bookingId: where.bookingId } : {}),
      ...(where.bookingRef ? { booking: { reference: where.bookingRef, ...(where.email ? { customer: { email: where.email } } : {}) } } : {}),
    },
    include: { booking: { include: { customer: true, package: true, payments: true } }, recordedBy: { select: { name: true } } },
  });
}

type Receipt = NonNullable<Awaited<ReturnType<typeof loadReceipt>>>;

export async function ReceiptDocument({ p }: { p: Receipt }) {
  const s = await getSettings();
  const b = p.booking;
  // Position as at this receipt: payments received up to and including it.
  const upTo = b.payments.filter((x) => x.receivedAt < p.receivedAt || (x.receivedAt.getTime() === p.receivedAt.getTime() && x.createdAt <= p.createdAt));
  const sum = summarisePayments(b.agreedTotal, upTo);
  const address = [s.addressLine, s.city, s.country].filter(Boolean).join(", ");

  return (
    <article className="relative overflow-hidden rounded-2xl border border-pine-900/15 bg-white p-6 sm:p-10 print:border-0 print:p-0">
      {p.voided && <div className="absolute inset-0 flex -rotate-12 items-center justify-center text-8xl font-bold text-red-700/15">VOID</div>}
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-gold-500/40 pb-6">
        <div>
          <Logo name={s.displayName} logoUrl={s.logoUrl} />
          <p className="mt-2 text-sm font-medium">{s.legalName}</p>
          {s.registrationNumber && <p className="text-xs text-stone">{s.registrationNumber}</p>}
          {address && <p className="text-xs text-stone">{address}</p>}
          <p className="text-xs text-stone">{[s.phone, s.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="sm:text-right">
          <p className="font-serif text-3xl font-semibold text-pine-900">Receipt</p>
          <p className="font-mono text-sm">{p.receiptNumber}</p>
          <p className="text-xs text-stone">{formatDate(p.receivedAt)}</p>
        </div>
      </header>
      <section className="grid gap-6 py-6 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone">Received from</p>
          <p className="mt-1 font-medium">{b.customer.fullName}</p>
          {b.customer.organisationName && <p>{b.customer.organisationName}</p>}
          <p className="break-all">{b.customer.email}</p>
          <p>{b.customer.phone}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone">For</p>
          <p className="mt-1 font-medium">{b.package.name}{b.season ? ` — ${b.season}` : ""}</p>
          <p>Booking {b.reference}</p>
          <p>{b.travellersCount} traveller(s)</p>
        </div>
      </section>
      <table className="table">
        <tbody>
          <tr><td>Amount received</td><td className="text-right font-serif text-2xl font-semibold">{formatMoney(p.amount, p.currency)}</td></tr>
          <tr><td>Payment method</td><td className="text-right">{METHOD[p.method]}{p.externalRef ? <span className="block break-all text-xs text-stone">{p.externalRef}</span> : null}</td></tr>
          {sum.total && <tr><td>Agreed total</td><td className="text-right">{formatMoney(sum.total, b.currency)}</td></tr>}
          <tr><td>Total received to date</td><td className="text-right">{formatMoney(sum.paid, b.currency)}{sum.percentPaid != null ? ` (${sum.percentPaid}%)` : ""}</td></tr>
          {sum.balance && <tr><td>Balance outstanding</td><td className="text-right font-medium">{formatMoney(sum.balance, b.currency)}</td></tr>}
        </tbody>
      </table>
      {p.voided && <p className="mt-4 text-sm text-red-800">This receipt has been voided{p.voidReason ? `: ${p.voidReason}` : ""}.</p>}
      <footer className="mt-10 border-t border-pine-900/10 pt-4 text-xs text-stone">
        <p>Issued by {s.legalName}{p.method === "PAYSTACK" ? " for an online payment confirmed by Paystack" : `. Recorded by ${p.recordedBy?.name ?? "staff"}`} on {formatDateTime(p.createdAt)}.</p>
        {s.receiptFooter && <p className="mt-1 whitespace-pre-line">{s.receiptFooter}</p>}
      </footer>
    </article>
  );
}
