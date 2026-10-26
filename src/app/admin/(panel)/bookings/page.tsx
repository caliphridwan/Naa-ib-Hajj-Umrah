import Link from "next/link";
import { BookingStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { summarisePayments } from "@/lib/payments";
import { BOOKING_TONE, Empty, Flash, humanize, PageHeader, Pill } from "@/components/admin/ui";

export default async function Bookings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; package?: string; ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = Object.values(BookingStatus).includes(sp.status as BookingStatus) ? (sp.status as BookingStatus) : undefined;
  const q = sp.q?.trim();
  const where: Prisma.BookingWhereInput = {
    ...(status ? { status } : {}),
    ...(sp.package ? { packageId: sp.package } : {}),
    ...(q ? { OR: [{ reference: { contains: q, mode: "insensitive" } }, { customer: { fullName: { contains: q, mode: "insensitive" } } }, { customer: { email: { contains: q, mode: "insensitive" } } }, { travellers: { some: { fullName: { contains: q, mode: "insensitive" } } } }] } : {}),
  };
  const [rows, packages] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { customer: true, package: true, payments: true } }),
    prisma.package.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Bookings" subtitle="Every booking starts as a request. Places are only secured once confirmed by staff." />
      <Flash ok={sp.ok} error={sp.error} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search reference, customer, traveller" className="input max-w-xs" />
        <select name="status" defaultValue={status ?? ""} className="input max-w-48">
          <option value="">All statuses</option>
          {Object.values(BookingStatus).map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
        <select name="package" defaultValue={sp.package ?? ""} className="input max-w-48">
          <option value="">All packages</option>
          {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn-outline">Filter</button>
      </form>
      <div className="card overflow-x-auto">
        {rows.length === 0 ? <Empty>No bookings match.</Empty> : (
          <table className="table">
            <thead><tr><th>Reference</th><th>Customer</th><th>Package</th><th>Travellers</th><th>Agreed total</th><th>Paid</th><th>% paid</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {rows.map((b) => {
                const sum = summarisePayments(b.agreedTotal, b.payments);
                return (
                  <tr key={b.id}>
                    <td><Link href={`/admin/bookings/${b.id}`} className="font-mono text-pine-800 hover:underline">{b.reference}</Link></td>
                    <td>{b.customer.fullName}</td>
                    <td>{b.package.name}</td>
                    <td>{b.travellersCount}</td>
                    <td>{b.agreedTotal ? formatMoney(b.agreedTotal, b.currency) : <span className="text-xs text-stone">Not set</span>}</td>
                    <td>{formatMoney(sum.paid, b.currency)}</td>
                    <td className="min-w-24">{sum.percentPaid != null ? (<><div className="text-xs">{sum.percentPaid}%</div><div className="mt-1 h-1.5 rounded-full bg-gold-100"><div className="h-full rounded-full bg-pine-700" style={{ width: `${sum.percentPaid}%` }} /></div></>) : <span className="text-xs text-stone">—</span>}</td>
                    <td><Pill tone={BOOKING_TONE[b.status]}>{humanize(b.status)}</Pill></td>
                    <td className="whitespace-nowrap text-xs">{formatDateTime(b.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
