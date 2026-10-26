import Link from "next/link";
import { InquiryStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { Empty, Flash, humanize, INQUIRY_TONE, PageHeader, Pill } from "@/components/admin/ui";

export default async function Inquiries({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = Object.values(InquiryStatus).includes(sp.status as InquiryStatus) ? (sp.status as InquiryStatus) : undefined;
  const q = sp.q?.trim();
  const where: Prisma.InquiryWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ reference: { contains: q, mode: "insensitive" } }, { customer: { fullName: { contains: q, mode: "insensitive" } } }, { customer: { email: { contains: q, mode: "insensitive" } } }, { customer: { phone: { contains: q } } }] } : {}),
  };
  const rows = await prisma.inquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { customer: true, package: true } });

  return (
    <>
      <PageHeader title="Enquiries" />
      <Flash ok={sp.ok} error={sp.error} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, email, phone, reference" className="input max-w-xs" />
        <select name="status" defaultValue={status ?? ""} className="input max-w-48">
          <option value="">All statuses</option>
          {Object.values(InquiryStatus).map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
        <button className="btn-outline">Filter</button>
      </form>
      <div className="card overflow-x-auto">
        {rows.length === 0 ? <Empty>No enquiries match.</Empty> : (
          <table className="table">
            <thead><tr><th>Reference</th><th>Customer</th><th>Type</th><th>Package</th><th>Travellers</th><th>Status</th><th>Received</th></tr></thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td><Link href={`/admin/inquiries/${i.id}`} className="font-mono text-pine-800 hover:underline">{i.reference}</Link></td>
                  <td>{i.customer.fullName}<div className="text-xs text-stone">{i.customer.organisationName}</div></td>
                  <td>{humanize(i.inquiryType)}</td>
                  <td>{i.package?.name ?? "—"}</td>
                  <td>{i.travellersCount}</td>
                  <td><Pill tone={INQUIRY_TONE[i.status]}>{humanize(i.status)}</Pill></td>
                  <td className="whitespace-nowrap text-xs">{formatDateTime(i.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
