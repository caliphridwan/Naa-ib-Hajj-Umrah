import Link from "next/link";
import { GENERAL_FAQS, HAJJ_DAYS, HOLY_CITIES, PREPARATION } from "@/lib/content";
import { getSitePhotos, PHOTO_SLOTS } from "@/lib/site-photos";
import { HolyImage } from "./HolyImage";
import { Honorific } from "./Honorific";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export function SectionHeading({ eyebrow, title, intro, light = false, center = false }: { eyebrow: string; title: string; intro?: React.ReactNode; light?: boolean; center?: boolean }) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`} data-reveal>
      <p className={`eyebrow ${light ? "text-gold-300" : ""}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-serif text-4xl font-semibold sm:text-5xl ${light ? "text-ivory" : "text-pine-900"}`}>{title}</h2>
      {intro && <p className={`mt-3 ${light ? "text-ivory/75" : "text-ink/70"}`}>{intro}</p>}
    </div>
  );
}

export function TwoHolyCities() {
  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="The Two Holy Cities"
        title="Makkah & Madinah"
        intro="The journey of a lifetime takes you to the two most sacred places in Islam."
      />
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {HOLY_CITIES.map((c, i) => (
          <article key={c.slot} className="card lift overflow-hidden" data-reveal style={d(i * 150)}>
            <div className="group relative">
              <HolyImage slot={c.slot} className="aspect-[16/10] bg-pine-950" imgClassName="transition duration-[1.6s] ease-out group-hover:scale-105" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-pine-950/85 to-transparent" />
              <div className="pointer-events-none absolute bottom-5 left-6 right-6">
                <p dir="rtl" lang="ar" className="saw text-right text-2xl text-gold-300">{c.arabic}</p>
                <h3 className="mt-1 font-serif text-2xl font-semibold text-ivory sm:text-3xl">{c.name}</h3>
              </div>
            </div>
            <div className="p-6 sm:p-7">
              <p className="font-medium text-pine-800"><Honorific text={c.lead} /></p>
              <p className="mt-3 text-sm leading-relaxed text-ink/75"><Honorific text={c.body} /></p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {c.places.map((p) => (
                  <li key={p} className="rounded-full bg-pine-50 px-3 py-1 text-xs text-pine-800">{p}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HajjTimeline({ detailed = false }: { detailed?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-pine-950 text-ivory">
      <div className="pattern-stars pattern-drift absolute inset-0 opacity-40" aria-hidden />
      <div className="container-page relative py-20">
        <SectionHeading
          light
          eyebrow="The journey of Hajj"
          title="Five days that change a life"
          intro="Hajj is performed from the 8th to the 13th of Dhul Hijjah, the final month of the Islamic calendar."
        />
        <ol className="relative mt-12 space-y-6 border-l border-gold-500/30 pl-8 sm:pl-10">
          {HAJJ_DAYS.map((h, i) => (
            <li key={h.name} className="relative" data-reveal style={d(i * 90)}>
              <span className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gold-500 bg-pine-950 sm:-left-[49px]">
                <span className="h-2 w-2 rounded-full bg-gold-500" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">{h.day} · {h.place}</p>
              <h3 className="mt-1 font-serif text-2xl font-semibold">{h.name}</h3>
              <p className={`mt-1 max-w-2xl text-sm leading-relaxed text-ivory/75 ${detailed ? "" : "line-clamp-2 sm:line-clamp-none"}`}>{h.body}</p>
            </li>
          ))}
        </ol>
        {!detailed && (
          <div className="mt-10" data-reveal>
            <Link href="/hajj-guide" className="btn border border-ivory/30 text-ivory hover:bg-ivory/10">Read the full Hajj Guide →</Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function Preparation() {
  return (
    <section className="container-page py-20">
      <SectionHeading eyebrow="Before you travel" title="Preparing for Hajj" intro="A few things to start on early. Our team will guide you through the current requirements for your season." />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PREPARATION.map((p, i) => (
          <div key={p.title} className="card lift p-6" data-reveal style={d(i * 80)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-100 font-serif text-lg font-semibold text-gold-700">{i + 1}</span>
            <h3 className="mt-4 font-serif text-xl font-semibold text-pine-900">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Renders only when at least one gallery photo has been uploaded. */
export async function Gallery() {
  const photos = await getSitePhotos();
  const slots = PHOTO_SLOTS.filter((s) => s.slot.startsWith("gallery-") && photos[s.slot]).map((s) => s.slot);
  if (slots.length === 0) return null;
  return (
    <section className="container-page py-20">
      <SectionHeading eyebrow="Gallery" title="Glimpses of the journey" />
      <div className="mt-10 grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-3">
        {slots.map((slot, i) => (
          <div key={slot} className={`group overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : ""}`} data-reveal style={d(i * 70)}>
            <HolyImage slot={slot} className="h-full w-full" imgClassName="transition duration-[1.6s] ease-out group-hover:scale-105" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function Faq({ items = GENERAL_FAQS, title = "Questions pilgrims ask" }: { items?: { q: string; a: string }[]; title?: string }) {
  return (
    <section className="container-page py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading eyebrow="FAQ" title={title} intro={<>Can&apos;t find your answer? <Link href="/enquire" className="font-medium text-pine-700 underline">Ask our team</Link>.</>} />
        <div className="divide-y divide-pine-900/10 border-y border-pine-900/10" data-reveal>
          {items.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium text-pine-900">
                {f.q}
                <span className="mt-0.5 text-xl leading-none text-gold-600 transition duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 pr-8 text-sm leading-relaxed text-ink/75">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
