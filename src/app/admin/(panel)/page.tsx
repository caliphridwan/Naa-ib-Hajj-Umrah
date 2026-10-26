import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { bookableIssues, STATUS_LABEL } from "@/lib/packages";
import { getSettings } from "@/lib/settings";
import { BOOKING_TONE, Card, Empty, Flash, humanize, INQUIRY_TONE, PACKAGE_TONE, PageHeader, Pill } from "@/components/admin/ui";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requireAdmin();
  const since = new Date(Date.now() - 30 * 86400_000);
  const [newInquiries, openBookings, paid30, packages, inquiries, bookings, settings] = await Promise.all([
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.booking.count({ where: { status: { in: ["REQUESTED", "UNDER_REVIEW", "AWAITING_DEPOSIT"] } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { voided: false, receivedAt: { gte: since }, currency: "NGN" } }),
    prisma.package.findMany({ orderBy: { sortOrder: "asc" }, where: { status: { not: "ARCHIVED" } } }),
    prisma.inquiry.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { customer: true, package: true } }),
    prisma.booking.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { customer: true, package: true } }),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader title={`Assalamu alaikum, ${me.name}`} subtitle={settings.legalName} />
      <Flash {...await searchParams} />
      {!settings.identityConfirmed && (
        <div className="mb-6 rounded-xl border border-gold-500/40 bg-gold-100/60 p-4 text-sm">
          The business display name, logo and legal details have not been confirmed yet. The site is using the temporary name
          “{settings.displayName}”.{me.role === "OWNER" && <> <Link href="/admin/settings" className="underline">Review business settings</Link>.</>}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="New enquiries" value={String(newInquiries)} href="/admin/inquiries?status=NEW" />
        <Stat label="Bookings awaiting action" value={String(openBookings)} href="/admin/bookings" />
        <Stat label="Payments received (30 days)" value={formatMoney(paid30._sum.amount ?? 0)} />
      </div>

      <Card title="Package readiness" className="mt-6">
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Package</th><th>Price</th><th>Status</th><th>Outstanding before bookable</th></tr></thead>
            <tbody>
              {packages.map((p) => {
                const issues = bookableIssues(p);
                return (
                  <tr key={p.id}>
                    <td><Link href={`/admin/packages/${p.id}`} className="font-medium text-pine-800 hover:underline">{p.name}</Link></td>
                    <td>{formatMoney(p.price, p.currency)}</td>
                    <td><Pill tone={PACKAGE_TONE[p.status]}>{STATUS_LABEL[p.status]}</Pill></td>
                    <td className="text-xs text-stone">{issues.length ? `${issues.length} item(s): ${issues.slice(0, 2).map((i) => i.message).join(" ")}${issues.length > 2 ? " …" : ""}` : "None"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Latest enquiries" actions={<Link href="/admin/inquiries" className="text-sm text-pine-700">All →</Link>}>
          {inquiries.length === 0 ? <Empty>No enquiries yet.</Empty> : (
            <ul className="divide-y divide-pine-900/5">
              {inquiries.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/inquiries/${i.id}`} className="min-w-0">
                    <span className="font-medium">{i.customer.fullName}</span>
                    <span className="block truncate text-xs text-stone">{i.package?.name ?? "General"} · {humanize(i.inquiryType)} · {formatDateTime(i.createdAt)}</span>
                  </Link>
                  <Pill tone={INQUIRY_TONE[i.status]}>{humanize(i.status)}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Latest booking requests" actions={<Link href="/admin/bookings" className="text-sm text-pine-700">All →</Link>}>
          {bookings.length === 0 ? <Empty>No bookings yet.</Empty> : (
            <ul className="divide-y divide-pine-900/5">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/bookings/${b.id}`} className="min-w-0">
                    <span className="font-medium">{b.customer.fullName}</span>
                    <span className="block truncate text-xs text-stone">{b.reference} · {b.package.name} · {b.travellersCount} traveller(s)</span>
                  </Link>
                  <Pill tone={BOOKING_TONE[b.status]}>{humanize(b.status)}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-stone">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold text-pine-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
