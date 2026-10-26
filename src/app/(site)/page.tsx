import Link from "next/link";
import { PackageCard } from "@/components/PackageCard";
import { PriceNotice } from "@/components/PriceNotice";
import { PaymentSteps } from "@/components/PaymentSteps";
import { HolyImage } from "@/components/HolyImage";
import { Faq, Gallery, HajjTimeline, Preparation, SectionHeading, TwoHolyCities } from "@/components/Sections";
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
    body: "Package details appear only after our team has verified them. Your place is secured only when we confirm your booking.",
  },
  {
    title: "Service with purpose",
    body: "We support pilgrims through enquiry, registration, preparation and travel, so you can focus on the worship of your journey.",
  },
];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default async function HomePage() {
  const [packages, s] = await Promise.all([getPublicPackages(), getSettings()]);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-pine-950 text-ivory">
        <HolyImage slot="hero" priority showCredit={false} className="absolute inset-0 -z-20 h-full w-full" imgClassName="scale-105" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pine-950 via-pine-950/85 to-pine-950/20" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950 via-transparent to-transparent" aria-hidden />
        <div className="pattern-stars pattern-drift absolute inset-0 -z-10 opacity-30" aria-hidden />
        <div className="container-page relative flex min-h-[88vh] flex-col justify-center py-24 sm:py-32">
          <span className="rule-draw mb-5" aria-hidden />
          <p className="eyebrow hero-in text-gold-300">{s.legalName}</p>
          <h1 className="hero-in mt-5 max-w-3xl font-serif text-5xl font-semibold leading-[1.05] sm:text-7xl" style={d(120)}>
            Answer the call with a team you can trust.
          </h1>
          <p className="hero-in mt-6 max-w-xl text-lg text-ivory/80" style={d(260)}>
            {s.tagline ??
              `Hajj to Makkah and Madinah, planned, priced and managed directly by ${s.displayName} — with clear information, honest pricing and attentive service from first enquiry to safe return.`}
          </p>
          <div className="hero-in mt-10 flex flex-wrap gap-3" style={d(400)}>
            <Link href="/packages" className="btn-gold">Book Your Hajj</Link>
            <Link href="/hajj-guide" className="btn border border-ivory/30 text-ivory hover:bg-ivory/10">Read the Hajj Guide</Link>
          </div>
          <dl className="hero-in mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-ivory/15 pt-6 text-sm" style={d(560)}>
            <div><dt className="text-ivory/60">Book</dt><dd className="mt-1 font-medium">No account needed</dd></div>
            <div><dt className="text-ivory/60">Pay</dt><dd className="mt-1 font-medium">In instalments online</dd></div>
            <div><dt className="text-ivory/60">Track</dt><dd className="mt-1 font-medium">% paid &amp; receipts</dd></div>
          </dl>
        </div>
      </section>

      {/* Packages */}
      <section className="container-page py-20">
        <SectionHeading
          eyebrow="Hajj Packages"
          title="Choose the package that suits your journey"
          intro={`Three tiers, each operated by ${s.displayName}. Full itineraries and inclusions are published as soon as our team confirms them. You can book any package now — our team will confirm the details and your total before you pay.`}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packages.map((p, i) => (
            <PackageCard key={p.id} pkg={p} delay={i * 120} />
          ))}
        </div>
        {packages.length === 0 && <p className="mt-10 text-ink/70">Packages will be published shortly.</p>}
        <PriceNotice className="mt-8 max-w-3xl" />
      </section>

      <TwoHolyCities />

      <HajjTimeline />

      {/* Booking & payment */}
      <section className="container-page py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Booking & payment" title="Book now, pay in instalments" intro="No account or password needed — every booking gets its own private payment page." />
          <Link href="/pay" className="btn-gold" data-reveal>Make a Payment</Link>
        </div>
        <PaymentSteps reveal />
      </section>

      <div className="bg-sand/50"><Preparation /></div>

      <Gallery />

      {/* Commitment */}
      <section className="container-page grid gap-10 py-20 md:grid-cols-[1fr_2fr]">
        <SectionHeading eyebrow="Our commitment" title="Trust is part of the journey" />
        <div className="grid gap-6 sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <div key={p.title} className="card lift p-6" data-reveal style={d(i * 100)}>
              <h3 className="font-serif text-xl font-semibold text-pine-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-white/60"><Faq /></div>

      {/* Groups CTA */}
      <section className="container-page py-20">
        <div className="sheen relative isolate grid items-center gap-10 overflow-hidden rounded-3xl bg-pine-900 p-10 text-ivory md:grid-cols-[2fr_1fr] md:p-14" data-reveal>
          <HolyImage slot="madinah" showCredit={false} className="absolute inset-0 -z-20 h-full w-full opacity-30" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pine-900 via-pine-900/90 to-pine-900/60" aria-hidden />
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
