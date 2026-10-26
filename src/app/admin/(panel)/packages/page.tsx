import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin, hasRole } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { bookableIssues, DETAIL_KEYS, isVerified, STATUS_LABEL, TIER_LABEL } from "@/lib/packages";
import { Flash, PACKAGE_TONE, PageHeader, Pill } from "@/components/admin/ui";

export default async function PackagesAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const packages = await prisma.package.findMany({ orderBy: [{ sortOrder: "asc" }, { price: "asc" }], include: { _count: { select: { bookings: true, inquiries: true } } } });
  return (
    <>
      <PageHeader
        title="Packages"
        subtitle="The catalogue offered by the company. Only verified details are shown publicly."
        actions={hasRole(me, "ADMIN") && <Link href="/admin/packages/new" className="btn-primary">New package</Link>}
      />
      <Flash {...sp} />
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Package</th><th>Price</th><th>Status</th><th>Verified details</th><th>Bookable readiness</th><th>Enquiries / bookings</th></tr>
          </thead>
          <tbody>
            {packages.map((p) => {
              const issues = bookableIssues(p);
              const verified = DETAIL_KEYS.filter((k) => isVerified(p, k)).length;
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/packages/${p.id}`} className="font-medium text-pine-800 hover:underline">{p.name}</Link>
                    <div className="text-xs text-stone">{TIER_LABEL[p.tier]} · /{p.slug}</div>
                  </td>
                  <td>
                    <div className="font-medium">{formatMoney(p.price, p.currency)}</div>
                    <div className="text-xs">{p.priceConfirmedAt ? <span className="text-pine-700">Confirmed</span> : <span className="text-gold-700">Not confirmed</span>}</div>
                  </td>
                  <td><Pill tone={PACKAGE_TONE[p.status]}>{STATUS_LABEL[p.status]}</Pill></td>
                  <td>{verified} / {DETAIL_KEYS.length}</td>
                  <td>{issues.length === 0 ? <Pill tone="green">Ready</Pill> : <span className="text-xs text-stone">{issues.length} item(s) outstanding</span>}</td>
                  <td>{p._count.inquiries} / {p._count.bookings}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
