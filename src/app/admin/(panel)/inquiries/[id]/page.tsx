import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { addInquiryNote, messageCustomer, setInquiryStatus } from "@/lib/admin/crm-actions";
import { Card, Flash, humanize, INQUIRY_TONE, PageHeader, Pill } from "@/components/admin/ui";
import { MessageForm } from "@/components/admin/MessageForm";

export default async function InquiryDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const i = await prisma.inquiry.findUnique({
    where: { id },
    include: { customer: true, package: true, notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } } },
  });
  if (!i) notFound();
  const comms = await prisma.communication.findMany({ where: { context: `inquiry:${i.reference}` }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageHeader back={{ href: "/admin/inquiries", label: "Enquiries" }} title={i.reference} subtitle={<>Received {formatDateTime(i.createdAt)} · <Pill tone={INQUIRY_TONE[i.status]}>{humanize(i.status)}</Pill></>} />
      <Flash {...await searchParams} />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card title="Enquiry">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <D k="Type" v={humanize(i.inquiryType)} />
              <D k="Travellers" v={String(i.travellersCount)} />
              <D k="Package" v={i.package ? `${i.package.name} (${formatMoney(i.package.price, i.package.currency)})` : "General enquiry"} />
              <D k="Preferred contact" v={i.preferredContact ?? "—"} />
            </dl>
            <p className="mt-4 whitespace-pre-line rounded-lg bg-sand/60 p-4 text-sm">{i.message}</p>
          </Card>
          <Card title="Internal notes">
            <form action={addInquiryNote.bind(null, i.id)} className="mb-4 space-y-2">
              <textarea name="body" className="input" rows={2} placeholder="Add a note (internal only)" required />
              <button className="btn-outline btn-sm">Add note</button>
            </form>
            <ul className="space-y-3 text-sm">
              {i.notes.map((n) => <li key={n.id} className="border-l-2 border-pine-100 pl-3"><p className="whitespace-pre-line">{n.body}</p><p className="text-xs text-stone">{n.author?.name} · {formatDateTime(n.createdAt)}</p></li>)}
            </ul>
          </Card>
          <Card title="Message customer">
            <MessageForm action={messageCustomer.bind(null, i.customerId, `/admin/inquiries/${i.id}`, `inquiry:${i.reference}`)} defaultSubject={`Your enquiry ${i.reference}`} />
            {comms.length > 0 && (
              <ul className="mt-5 space-y-2 border-t border-pine-900/10 pt-4 text-sm">
                {comms.map((c) => <li key={c.id}><span className="font-medium">{c.subject}</span> <span className="text-xs text-stone">· {humanize(c.status)} · {formatDateTime(c.createdAt)}</span></li>)}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Customer">
            <p className="font-medium"><Link href={`/admin/customers/${i.customerId}`} className="hover:underline">{i.customer.fullName}</Link></p>
            {i.customer.organisationName && <p className="text-sm">{i.customer.organisationName}</p>}
            <p className="mt-2 text-sm"><a href={`mailto:${i.customer.email}`} className="text-pine-700">{i.customer.email}</a></p>
            <p className="text-sm"><a href={`tel:${i.customer.phone}`} className="text-pine-700">{i.customer.phone}</a></p>
            {i.customer.city && <p className="text-sm text-stone">{i.customer.city}</p>}
          </Card>
          <Card title="Status">
            <form action={setInquiryStatus.bind(null, i.id)} className="space-y-2">
              <select name="status" defaultValue={i.status} className="input">
                {Object.values(InquiryStatus).map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
              </select>
              <button className="btn-primary btn-sm">Update</button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

function D({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-xs uppercase tracking-wide text-stone">{k}</dt><dd className="mt-0.5">{v}</dd></div>;
}
