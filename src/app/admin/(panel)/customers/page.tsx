import Link from "next/link";
import { CustomerType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { Empty, humanize, PageHeader } from "@/components/admin/ui";

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const type = Object.values(CustomerType).includes(sp.type as CustomerType) ? (sp.type as CustomerType) : undefined;
  const where: Prisma.CustomerWhereInput = {
    ...(type ? { type } : {}),
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { organisationName: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const rows = await prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, take: 300, include: { _count: { select: { inquiries: true, bookings: true } } } });
  return (
    <>
      <PageHeader title="Customers" subtitle="Pilgrims, families, group organisers and institutions." />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, email, phone, organisation" className="input max-w-xs" />
        <select name="type" defaultValue={type ?? ""} className="input max-w-48">
          <option value="">All types</option>
          {Object.values(CustomerType).map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
        </select>
        <button className="btn-outline">Filter</button>
      </form>
      <div className="card overflow-x-auto">
        {rows.length === 0 ? <Empty>No customers yet.</Empty> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Type</th><th>Contact</th><th>Enquiries</th><th>Bookings</th><th>Since</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/admin/customers/${c.id}`} className="font-medium text-pine-800 hover:underline">{c.fullName}</Link><div className="text-xs text-stone">{c.organisationName}</div></td>
                  <td>{humanize(c.type)}</td>
                  <td className="text-xs">{c.email}<br />{c.phone}</td>
                  <td>{c._count.inquiries}</td>
                  <td>{c._count.bookings}</td>
                  <td className="text-xs">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
