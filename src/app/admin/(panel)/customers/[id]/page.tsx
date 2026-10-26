import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { messageCustomer } from "@/lib/admin/crm-actions";
import { BOOKING_TONE, Card, Flash, humanize, INQUIRY_TONE, PageHeader, Pill } from "@/components/admin/ui";
import { MessageForm } from "@/components/admin/MessageForm";

export default async function CustomerDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const c = await prisma.customer.findUnique({
    where: { id },
    include: {
      inquiries: { orderBy: { createdAt: "desc" }, include: { package: true } },
      bookings: { orderBy: { createdAt: "desc" }, include: { package: true } },
      communications: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!c) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/customers", label: "Customers" }} title={c.fullName} subtitle={`${humanize(c.type)}${c.organisationName ? ` · ${c.organisationName}` : ""} · ${c.email} · ${c.phone}`} />
      <Flash {...await searchParams} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Bookings">
          <ul className="divide-y divide-pine-900/5 text-sm">
            {c.bookings.map((b) => <li key={b.id} className="flex justify-between py-2"><Link href={`/admin/bookings/${b.id}`} className="font-mono text-pine-800 hover:underline">{b.reference}</Link><span>{b.package.name}</span><Pill tone={BOOKING_TONE[b.status]}>{humanize(b.status)}</Pill></li>)}
          </ul>
          {c.bookings.length === 0 && <p className="text-sm text-stone">None.</p>}
        </Card>
        <Card title="Enquiries">
          <ul className="divide-y divide-pine-900/5 text-sm">
            {c.inquiries.map((i) => <li key={i.id} className="flex justify-between py-2"><Link href={`/admin/inquiries/${i.id}`} className="font-mono text-pine-800 hover:underline">{i.reference}</Link><span>{i.package?.name ?? "General"}</span><Pill tone={INQUIRY_TONE[i.status]}>{humanize(i.status)}</Pill></li>)}
          </ul>
          {c.inquiries.length === 0 && <p className="text-sm text-stone">None.</p>}
        </Card>
        <Card title="Send a message"><MessageForm action={messageCustomer.bind(null, c.id, `/admin/customers/${c.id}`, `customer:${c.id}`)} /></Card>
        <Card title="Communications">
          <ul className="space-y-2 text-sm">
            {c.communications.map((m) => <li key={m.id}><span className="font-medium">{m.subject}</span><span className="block text-xs text-stone">{humanize(m.status)} · {formatDateTime(m.createdAt)}</span></li>)}
          </ul>
          {c.communications.length === 0 && <p className="text-sm text-stone">None.</p>}
        </Card>
      </div>
    </>
  );
}
