import Link from "next/link";
import { PackageCard } from "@/components/PackageCard";
import { PriceNotice } from "@/components/PriceNotice";
import { PaymentSteps } from "@/components/PaymentSteps";
import { getPublicPackages } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

const PRINCIPLES = [
  {
    title: "One accountable operator",
    body: "Every package on this website is offered and managed directly by our own team — not resold through a marketplace.",
  },
  {
    title: "Transparent pricing",
    body: "We show the price we have set, the basis it is quoted on, and what is and is not included once those details are confirmed.",
  },
  {
    title: "Nothing promised before it is confirmed",
    body: "Package details appear only after our team has verified them. Your place is secured only when we confirm your booking in writing.",
  },
  {
    title: "Service with purpose",
    body: "We support pilgrims through enquiry, registration, preparation and travel, so you can focus on the worship of your journey.",
  },
];

export default async function HomePage() {
  const [packages, s] = await Promise.all([getPublicPackages(), getSettings()]);

  return (
    <>
      <section className="relative overflow-hidden bg-pine-950 text-ivory">
        <div className="pattern-stars absolute inset-0 opacity-60" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pine-950/40 to-pine-950" aria-hidden />
        <div className="container-page relative py-24 sm:py-32">
          <p className="eyebrow text-gold-300">{s.legalName}</p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl">
            Answer the call with a team you can trust.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ivory/75">
            {s.tagline ??
              `Hajj packages planned, priced and managed directly by ${s.displayName} — with clear information, honest pricing and attentive service from first enquiry to safe return.`}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/packages" className="btn-gold">Book Your Hajj</Link>
            <Link href="/enquire" className="btn border border-ivory/30 text-ivory hover:bg-ivory/10">Speak with Our Team</Link>
          </div>
        </div>
      </section>

      <section className="container-page -mt-px py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Hajj Packages</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-pine-900">Choose the package that suits your journey</h2>
          <p className="mt-3 text-ink/70">
            Three tiers, each operated by {s.displayName}. Full itineraries and inclusions are published as soon as our team
            confirms them. You can book any package now — our team will confirm the details and your total before you pay.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packages.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>
        {packages.length === 0 && <p className="mt-10 text-ink/70">Packages will be published shortly.</p>}
        <PriceNotice className="mt-8 max-w-3xl" />
      </section>

      <section className="container-page pb-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Booking &amp; payment</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-pine-900">Book now, pay in instalments</h2>
            <p className="mt-2 text-ink/70">No account or password needed — every booking gets its own private payment page.</p>
          </div>
          <Link href="/pay" className="btn-gold">Make a Payment</Link>
        </div>
        <PaymentSteps />
      </section>

      <section className="bg-sand/60">
        <div className="container-page grid gap-10 py-20 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Our commitment</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-pine-900">Trust is part of the journey</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="card p-6">
                <h3 className="font-serif text-xl font-semibold text-pine-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid items-center gap-10 rounded-3xl bg-pine-900 p-10 text-ivory md:grid-cols-[2fr_1fr] md:p-14">
          <div>
            <p className="eyebrow text-gold-300">Families, groups &amp; institutions</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">Travelling together?</h2>
            <p className="mt-3 text-ivory/75">
              Tell us about your family, group or organisation and our team will respond with the options we can offer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/enquire?type=GROUP" className="btn-gold">Group Enquiry</Link>
            <Link href="/who-we-serve" className="btn border border-ivory/30 text-ivory hover:bg-ivory/10">Learn more</Link>
          </div>
        </div>
      </section>
    </>
  );
}
