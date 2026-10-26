import Link from "next/link";
import { HolyImage } from "@/components/HolyImage";
import { Faq, HajjTimeline, Preparation, SectionHeading, TwoHolyCities } from "@/components/Sections";
import { HAJJ_TYPES } from "@/lib/content";

export const metadata = {
  title: "Hajj Guide",
  description: "A step-by-step guide to Hajj: the days of Hajj, the three types of Hajj, Makkah and Madinah, and how to prepare.",
};

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const PILLARS = [
  { name: "Ihram", body: "The sacred state entered with intention, marked for men by two plain white garments." },
  { name: "Wuquf at 'Arafah", body: "Standing at Arafah on the 9th of Dhul Hijjah. Without it there is no Hajj." },
  { name: "Tawaf al-Ifadah", body: "Circling the Kaaba seven times after Arafah, from the 10th of Dhul Hijjah." },
  { name: "Sa'i", body: "Walking seven times between Safa and Marwah, following in the footsteps of Hajar." },
];

export default function HajjGuidePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-pine-950 text-ivory">
        <HolyImage slot="guide" priority showCredit={false} className="absolute inset-0 -z-20 h-full w-full" imgClassName="ken-burns" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pine-950 via-pine-950/85 to-pine-950/30" aria-hidden />
        <div className="pattern-stars pattern-drift absolute inset-0 -z-10 opacity-40" aria-hidden />
        <div className="hero-glow -z-10 -left-40 top-1/4" aria-hidden />
        <div className="container-page py-24 sm:py-32">
          <span className="rule-draw mb-5" aria-hidden />
          <p className="eyebrow hero-in text-gold-300">Hajj Guide</p>
          <h1 className="hero-in mt-4 max-w-2xl font-serif text-5xl font-semibold leading-tight sm:text-6xl" style={d(120)}>
            Your journey, step by step
          </h1>
          <p className="hero-in mt-5 max-w-xl text-lg text-ivory/80" style={d(260)}>
            Hajj is the fifth pillar of Islam — an obligation once in a lifetime for every Muslim who is able. This guide
            gives an overview of what to expect. Always learn the rites in detail from qualified scholars.
          </p>
        </div>
      </section>

      <section className="container-page py-20">
        <SectionHeading eyebrow="The foundations" title="The pillars of Hajj" intro="Most scholars list these among the essential acts of Hajj. Scholars differ on some details, so learn from a scholar you trust." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <div key={p.name} className="card lift p-6" data-reveal style={d(i * 90)}>
              <p className="font-serif text-4xl font-semibold text-gold-500">{i + 1}</p>
              <h3 className="mt-2 font-serif text-xl font-semibold text-pine-900">{p.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <HajjTimeline detailed />

      <section className="container-page py-20">
        <SectionHeading eyebrow="Three ways" title="The types of Hajj" intro="Your package and travel dates will determine which type of Hajj you perform. Our team will explain what applies to you." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {HAJJ_TYPES.map((t, i) => (
            <div key={t.name} className="card lift p-7" data-reveal style={d(i * 110)}>
              <h3 className="font-serif text-3xl font-semibold text-pine-900">{t.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-sand/50"><TwoHolyCities /></div>

      <Preparation />

      <div className="bg-white/60"><Faq /></div>

      <section className="container-page pb-20">
        <div className="rounded-3xl bg-pine-900 p-10 text-center text-ivory" data-reveal>
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Ready to begin your journey?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ivory/75">Choose a package and book now. No account and no payment needed until our team confirms your place.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/packages" className="btn-gold">View Hajj Packages</Link>
            <Link href="/enquire" className="btn border border-ivory/30 text-ivory hover:bg-ivory/10">Ask a Question</Link>
          </div>
        </div>
      </section>
    </>
  );
}
