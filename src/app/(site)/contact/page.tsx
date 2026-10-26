import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const s = await getSettings();
  const address = [s.addressLine, s.city, s.country].filter(Boolean).join(", ");
  const rows: [string, string | null][] = [
    ["Telephone", s.phone],
    ["WhatsApp", s.whatsapp],
    ["Email", s.email],
    ["Office", address || null],
    ["Office hours", s.officeHours],
  ];
  const any = rows.some(([, v]) => v);
  return (
    <section className="container-page max-w-3xl py-16">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-3 font-serif text-5xl font-semibold text-pine-900">Get in touch</h1>
      {any ? (
        <dl className="card mt-8 divide-y divide-pine-900/10">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="grid gap-1 p-5 sm:grid-cols-[10rem_1fr]">
              <dt className="text-sm text-stone">{k}</dt>
              <dd className="whitespace-pre-line font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-6 text-ink/70">Our official contact details will be published here shortly. In the meantime, please send us an enquiry and our team will respond.</p>
      )}
      <Link href="/enquire" className="btn-primary mt-8">Send an enquiry</Link>
    </section>
  );
}
