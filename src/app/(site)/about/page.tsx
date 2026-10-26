import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <section className="container-page max-w-3xl py-16">
      <p className="eyebrow">About us</p>
      <h1 className="mt-3 font-serif text-5xl font-semibold text-pine-900">{s.displayName}</h1>
      <p className="mt-2 text-ink/60">{s.legalName}</p>
      <div className="mt-8 space-y-5 leading-relaxed text-ink/80">
        <p>
          {s.displayName} is the travel operator behind this website. The Hajj packages you see here are planned, priced and
          managed by our own team — we are not a marketplace and we do not list packages on behalf of other agencies.
        </p>
        <p>
          We believe a journey of worship deserves clarity and care. That is why we publish package details only once we
          have confirmed them, explain what a price covers and what it does not, and confirm every booking personally.
        </p>
      </div>
      {(s.registrationNumber || s.licenceDetails) && (
        <div className="card mt-10 p-6 text-sm">
          <h2 className="font-serif text-xl font-semibold text-pine-900">Company information</h2>
          {s.registrationNumber && <p className="mt-2">{s.registrationNumber}</p>}
          {s.licenceDetails && <p className="mt-1 whitespace-pre-line">{s.licenceDetails}</p>}
        </div>
      )}
      <Link href="/enquire" className="btn-primary mt-10">Speak with our team</Link>
    </section>
  );
}
