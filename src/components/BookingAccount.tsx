import Link from "next/link";
import { Prisma } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { GATEWAY_MIN_NGN, PAYABLE_STATUSES, summarisePayments } from "@/lib/payments";
import { paystackEnabled } from "@/lib/paystack";
import { getSettings } from "@/lib/settings";
import { PaymentProgress } from "./PaymentProgress";
import { PayForm } from "./PayForm";
import { PaymentSteps } from "./PaymentSteps";

const BOOKING_LABEL: Record<string, string> = {
  REQUESTED: "Request received — awaiting review",
  UNDER_REVIEW: "Under review by our team",
  AWAITING_DEPOSIT: "Approved — payment open",
  CONFIRMED: "Confirmed",
  WAITLISTED: "Waitlisted",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};
const METHOD: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer", CASH: "Cash", POS: "POS", CHEQUE: "Cheque", PAYSTACK: "Online (Paystack)", OTHER: "Other",
};

export type BookingWithPayments = Prisma.BookingGetPayload<{ include: { package: true; customer: true; payments: true } }>;

/** The customer's private booking page: status, payment progress, pay form and receipts. */
export async function BookingAccount({
  booking: b,
  token,
  flash,
}: {
  booking: BookingWithPayments;
  token: string;
  flash: { isNew?: boolean; paid?: string; payerror?: string };
}) {
  const summary = summarisePayments(b.agreedTotal, b.payments);
  const payable = PAYABLE_STATUSES.includes(b.status) && !!summary.balance && summary.balance.gt(0);
  const awaitingApproval = ["REQUESTED", "UNDER_REVIEW"].includes(b.status) || (PAYABLE_STATUSES.includes(b.status) && !b.agreedTotal);
  const settings = await getSettings();
  const companyMin = Prisma.Decimal.max(settings.minOnlineInstalment ?? GATEWAY_MIN_NGN, GATEWAY_MIN_NGN);
  const minimum = summary.balance ? Prisma.Decimal.min(companyMin, summary.balance) : companyMin;
  const visible = b.payments.filter((p) => !p.voided).sort((x, y) => x.receivedAt.getTime() - y.receivedAt.getTime());
  const receiptHref = (no: string) => `/receipt?ref=${encodeURIComponent(b.reference)}&t=${token}&no=${encodeURIComponent(no)}`;
  const step = awaitingApproval ? 2 : payable ? 3 : summary.percentPaid === 100 ? 4 : 2;

  return (
    <div className="space-y-6">
      {flash.isNew && (
        <div className="rounded-2xl border border-pine-600/20 bg-pine-50 p-5 text-sm text-pine-900">
          <p className="font-semibold">Your booking request has been received.</p>
          <p className="mt-1">
            <strong>Save this page</strong> — it is your private booking and payment page. We have also emailed the link to{" "}
            {b.customer.email}. You don&apos;t need an account or password.
          </p>
        </div>
      )}
      {flash.paid && <div role="status" className="rounded-xl border border-pine-600/20 bg-pine-50 p-4 text-sm text-pine-900">{flash.paid}</div>}
      {flash.payerror && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{flash.payerror}</div>}

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Booking</p>
            <h1 className="mt-1 font-mono text-2xl text-pine-900 sm:text-3xl">{b.reference}</h1>
            <p className="mt-1 text-sm text-ink/70">{b.customer.fullName}</p>
          </div>
          <span className="rounded-full bg-pine-50 px-3 py-1 text-xs font-medium text-pine-800">{BOOKING_LABEL[b.status]}</span>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-stone">Package</dt><dd className="font-medium">{b.package.name}{b.season ? ` — ${b.season}` : ""}</dd></div>
          <div><dt className="text-stone">Travellers</dt><dd className="font-medium">{b.travellersCount}</dd></div>
          <div><dt className="text-stone">Quoted price</dt><dd className="font-medium">{formatMoney(b.unitPrice, b.currency)}{b.pricingBasis ? ` (${b.pricingBasis})` : ""}</dd></div>
          <div><dt className="text-stone">Requested</dt><dd className="font-medium">{formatDate(b.createdAt)}</dd></div>
        </dl>
      </div>

      {!["CANCELLED", "WAITLISTED"].includes(b.status) && <PaymentSteps current={step} />}

      <div className="card p-6">
        <h2 className="font-serif text-2xl font-semibold text-pine-900">Payment progress</h2>
        <div className="mt-4"><PaymentProgress summary={summary} currency={b.currency} /></div>
      </div>

      <div id="pay" className="card scroll-mt-24 border-2 border-pine-700/30 p-6">
        <h2 className="font-serif text-2xl font-semibold text-pine-900">Make a payment</h2>
        <div className="mt-4">
          {payable ? (
            paystackEnabled() ? (
              <PayForm reference={b.reference} token={token} balance={summary.balance!.toString()} minimum={minimum.toString()} />
            ) : (
              <p className="text-sm text-ink/80">Online payment is being set up. Please pay using the instructions provided by our team and keep your receipt.</p>
            )
          ) : awaitingApproval ? (
            <p className="text-sm text-ink/80">
              Payment opens as soon as our team approves your booking and confirms your total. We will email you, and this
              page will show a payment button. You don&apos;t need to do anything until then.
            </p>
          ) : summary.percentPaid === 100 ? (
            <p className="text-sm font-medium text-pine-700">Your booking is fully paid. Thank you.</p>
          ) : (
            <p className="text-sm text-ink/80">Online payment is not available for this booking. Please contact our team.</p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-serif text-2xl font-semibold text-pine-900">Payment history &amp; receipts</h2>
        {visible.length === 0 ? (
          <p className="mt-3 text-sm text-stone">No payments yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Receipt</th></tr></thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{formatDate(p.receivedAt)}</td>
                    <td className="whitespace-nowrap font-medium">{formatMoney(p.amount, p.currency)}</td>
                    <td>{METHOD[p.method]}</td>
                    <td><Link href={receiptHref(p.receiptNumber)} className="font-mono text-xs text-pine-700 underline">{p.receiptNumber}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
