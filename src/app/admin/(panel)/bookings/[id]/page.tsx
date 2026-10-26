import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, hasRole } from "@/lib/auth";
import { formatDate, formatDateTime, toDateInput } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import * as C from "@/lib/admin/crm-actions";
import { BOOKING_TONE, Card, Flash, humanize, PageHeader, Pill } from "@/components/admin/ui";
import { MessageForm } from "@/components/admin/MessageForm";
import { PaymentProgress } from "@/components/PaymentProgress";
import { summarisePayments } from "@/lib/payments";
import { payUrl } from "@/lib/paylink";
import { CopyLink } from "@/components/admin/CopyLink";

export default async function BookingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      package: true,
      travellers: { orderBy: [{ isLead: "desc" }, { fullName: "asc" }] },
      payments: { orderBy: { receivedAt: "asc" }, include: { recordedBy: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      onlineAttempts: { where: { status: { not: "SUCCESS" } }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!b) notFound();
  const comms = await prisma.communication.findMany({ where: { context: `booking:${b.reference}` }, orderBy: { createdAt: "desc" } });
  const summary = summarisePayments(b.agreedTotal, b.payments);
  const quoted = b.unitPrice.mul(b.travellersCount);
  const isAdmin = hasRole(me, "ADMIN");

  return (
    <>
      <PageHeader back={{ href: "/admin/bookings", label: "Bookings" }} title={b.reference} subtitle={<>Requested {formatDateTime(b.createdAt)} · <Pill tone={BOOKING_TONE[b.status]}>{humanize(b.status)}</Pill></>} />
      <Flash {...await searchParams} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card title="Quotation at time of request">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <D k="Package" v={b.package.name} />
              <D k="Season" v={b.season ?? "—"} />
              <D k="Pricing basis" v={b.pricingBasis ?? "—"} />
              <D k="Unit price" v={formatMoney(b.unitPrice, b.currency)} />
              <D k="Travellers" v={String(b.travellersCount)} />
              <D k="Indicative total" v={formatMoney(quoted, b.currency)} />
            </dl>
            {!b.pricingBasis && <p className="mt-3 rounded-lg bg-gold-100/70 p-3 text-xs">Booked before this package&apos;s pricing basis was confirmed. Confirm the package details and the total with the customer before setting the agreed total.</p>}
            <p className="hint mt-3">The indicative total is unit price × travellers and depends on the pricing basis. Set the agreed total below once the final amount is confirmed with the customer.</p>
            {b.specialRequests && <p className="mt-4 whitespace-pre-line rounded-lg bg-sand/60 p-3 text-sm"><strong>Special requests:</strong> {b.specialRequests}</p>}
          </Card>

          <Card title="Travellers">
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {b.travellers.map((t) => <li key={t.id}>{t.fullName}{t.isLead && <span className="ml-2 text-xs text-gold-700">Lead</span>}</li>)}
            </ol>
          </Card>

          <Card title="Payments & receipts">
            <div className="mb-5"><PaymentProgress summary={summary} currency={b.currency} /></div>
            {b.payments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Receipt</th><th>Date</th><th>Amount</th><th>Method</th><th>Recorded by</th><th></th></tr></thead>
                  <tbody>
                    {b.payments.map((p) => (
                      <tr key={p.id} className={p.voided ? "opacity-50" : ""}>
                        <td className="font-mono text-xs">{p.receiptNumber}{p.voided && <div className="text-red-700">VOID: {p.voidReason}</div>}</td>
                        <td>{formatDate(p.receivedAt)}</td>
                        <td>{formatMoney(p.amount, p.currency)}</td>
                        <td>{humanize(p.method)}{p.externalRef && <div className="text-xs text-stone">{p.externalRef}</div>}</td>
                        <td className="text-xs">{p.method === "PAYSTACK" ? "Online" : p.recordedBy?.name}</td>
                        <td className="space-y-1">
                          <Link href={`/admin/bookings/${b.id}/receipt/${p.id}`} className="text-xs text-pine-700 underline">Receipt</Link>
                          {me.role === "OWNER" && !p.voided && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-red-700">Void</summary>
                              <form action={C.voidPayment.bind(null, b.id, p.id)} className="mt-1 space-y-1">
                                <input name="reason" className="input" placeholder="Reason" required />
                                <button className="btn-danger btn-sm">Void receipt</button>
                              </form>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {isAdmin && (
              <details className="mt-4 border-t border-pine-900/10 pt-4">
                <summary className="cursor-pointer text-sm font-medium text-pine-800">Record a payment…</summary>
                <form action={C.recordPayment.bind(null, b.id)} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Amount ({b.currency})</label><input name="amount" className="input" inputMode="decimal" required /></div>
                  <div><label className="label">Date received</label><input name="receivedAt" type="date" className="input" defaultValue={toDateInput(new Date())} required /></div>
                  <div><label className="label">Method</label><select name="method" className="input">{Object.values(PaymentMethod).filter((m) => m !== "PAYSTACK").map((m) => <option key={m} value={m}>{humanize(m)}</option>)}</select></div>
                  <div><label className="label">Bank / transaction reference</label><input name="externalRef" className="input" /></div>
                  <div className="sm:col-span-2"><label className="label">Note</label><input name="note" className="input" /></div>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="notify" defaultChecked className="accent-pine-700" /> Email the receipt confirmation to the customer</label>
                  <button className="btn-primary btn-sm justify-self-start">Record payment &amp; issue receipt</button>
                </form>
              </details>
            )}
          </Card>

          {b.onlineAttempts.length > 0 && (
            <Card title="Online payment attempts (not completed)">
              <p className="hint mb-3">Checkouts the customer started on Paystack that have not been recorded as payments. Mismatches need manual review in the Paystack dashboard.</p>
              <table className="table">
                <thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>Started</th></tr></thead>
                <tbody>
                  {b.onlineAttempts.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono text-xs">{a.reference}</td>
                      <td>{formatMoney((Number(a.amountKobo) / 100).toFixed(2), a.currency)}</td>
                      <td className="text-xs">{humanize(a.status)}{a.gatewayMessage && <div className="text-stone">{a.gatewayMessage}</div>}</td>
                      <td className="text-xs">{formatDateTime(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <Card title="Internal notes">
            <form action={C.addBookingNote.bind(null, b.id)} className="mb-4 space-y-2">
              <textarea name="body" className="input" rows={2} placeholder="Add a note (internal only)" required />
              <button className="btn-outline btn-sm">Add note</button>
            </form>
            <ul className="space-y-3 text-sm">
              {b.notes.map((n) => <li key={n.id} className="border-l-2 border-pine-100 pl-3"><p className="whitespace-pre-line">{n.body}</p><p className="text-xs text-stone">{n.author?.name} · {formatDateTime(n.createdAt)}</p></li>)}
            </ul>
          </Card>

          <Card title="Communications">
            <MessageForm action={C.messageCustomer.bind(null, b.customerId, `/admin/bookings/${b.id}`, `booking:${b.reference}`)} defaultSubject={`Your booking ${b.reference}`} />
            {comms.length > 0 && (
              <ul className="mt-5 space-y-2 border-t border-pine-900/10 pt-4 text-sm">
                {comms.map((c) => <li key={c.id}><span className="font-medium">{c.subject}</span> <span className="text-xs text-stone">· {humanize(c.status)} · {formatDateTime(c.createdAt)}</span></li>)}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="font-medium"><Link href={`/admin/customers/${b.customerId}`} className="hover:underline">{b.customer.fullName}</Link></p>
            <p className="text-xs text-stone">{humanize(b.customer.type)}{b.customer.organisationName ? ` · ${b.customer.organisationName}` : ""}</p>
            <p className="mt-2 text-sm"><a href={`mailto:${b.customer.email}`} className="text-pine-700">{b.customer.email}</a></p>
            <p className="text-sm"><a href={`tel:${b.customer.phone}`} className="text-pine-700">{b.customer.phone}</a></p>
          </Card>
          <Card title="Customer payment link">
            <p className="mb-3 text-xs text-stone">The customer&apos;s private booking &amp; payment page. No account needed. It&apos;s included in every booking email automatically.</p>
            <CopyLink url={payUrl(b.reference)} whatsappText={`Assalamu alaikum ${b.customer.fullName}, here is your private booking & payment page for ${b.reference}:`} />
          </Card>
          <Card title="Status">
            <form action={C.setBookingStatus.bind(null, b.id)} className="space-y-3">
              <select name="status" defaultValue={b.status} className="input">
                {Object.values(BookingStatus).map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked className="accent-pine-700" /> Notify customer by email</label>
              <textarea name="message" className="input" rows={2} placeholder="Optional extra message" />
              <button className="btn-primary btn-sm">Update status</button>
              <p className="hint">Confirming requires an agreed total. Once the status is “Awaiting deposit” or “Confirmed” and a total is set, the customer can pay online in instalments.</p>
            </form>
          </Card>
          {isAdmin && (
            <Card title="Agreed total">
              <form action={C.setAgreedTotal.bind(null, b.id)} className="space-y-2">
                <input name="agreedTotal" className="input" inputMode="decimal" defaultValue={b.agreedTotal?.toString() ?? ""} placeholder={quoted.toString()} required />
                <button className="btn-outline btn-sm">Save</button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function D({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-xs uppercase tracking-wide text-stone">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>;
}
