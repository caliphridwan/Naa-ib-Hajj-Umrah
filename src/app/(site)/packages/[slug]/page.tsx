import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PriceNotice } from "@/components/PriceNotice";
import { PaymentSteps } from "@/components/PaymentSteps";
import { getPublicPackage } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { canRequestBooking, isConfirmedQuotation, DETAIL_FIELDS, isVerified, publicStatusLabel, TIER_LABEL, type DetailKey } from "@/lib/packages";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pkg = await getPublicPackage((await params).slug);
  return { title: pkg?.name ?? "Package" };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-pine-900/10 py-7" data-reveal>
      <h2 className="font-serif text-2xl font-semibold text-pine-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function PackagePage({ params }: Props) {
  const pkg = await getPublicPackage((await params).slug);
  if (!pkg) notFound();

  const v = (k: DetailKey) => isVerified(pkg, k);
  const bookable = canRequestBooking(pkg);
  const confirmed = isConfirmedQuotation(pkg);
  const vip = pkg.tier === "VIP";
  const pending = DETAIL_FIELDS.filter((f) => f.key !== "description" && !v(f.key));

  const text: [DetailKey, string, string | null][] = [
    ["accommodation", "Accommodation", pkg.accommodation],
    ["flights", "Flight arrangements", pkg.flights],
    ["groundTransport", "Ground transportation", pkg.groundTransport],
    ["meals", "Meals", pkg.meals],
    ["visaAssistance", "Visa and permit assistance", pkg.visaAssistance],
  ];

  return (
    <>
      <section className={`relative overflow-hidden ${vip ? "bg-pine-950 text-ivory" : "bg-pine-900 text-ivory"}`}>
        <div className={`pattern-stars pattern-drift absolute inset-0 ${vip ? "opacity-70" : "opacity-40"}`} aria-hidden />
        <div className="hero-glow -left-60 -bottom-72" aria-hidden />
        <div className="container-page relative grid gap-10 py-16 md:grid-cols-[3fr_2fr] md:py-20">
          <div>
            <Link href="/packages" className="text-sm text-ivory/60 hover:text-ivory">← All packages</Link>
            <p className="eyebrow hero-in mt-6 text-gold-300">{TIER_LABEL[pkg.tier]} Hajj{v("season") ? ` · ${pkg.season}` : ""}</p>
            <h1 className="hero-in mt-3 font-serif text-5xl font-semibold sm:text-6xl" style={{ "--d": "120ms" } as React.CSSProperties}>{pkg.name}</h1>
            {pkg.tagline && <p className="mt-4 max-w-xl text-lg text-ivory/75">{pkg.tagline}</p>}
          </div>
          <div className={`hero-in rounded-3xl p-7 ${vip ? "sheen border border-gold-500/40 bg-pine-900/60" : "bg-ivory text-ink"}`} style={{ "--d": "260ms" } as React.CSSProperties}>
            <p className={`text-xs uppercase tracking-wider ${vip ? "text-ivory/60" : "text-stone"}`}>Starting price</p>
            <p className="mt-1 font-serif text-5xl font-semibold">{formatMoney(pkg.price, pkg.currency)}</p>
            <p className={`mt-1 text-sm ${vip ? "text-ivory/70" : "text-ink/70"}`}>
              {v("pricingBasis") ? pkg.pricingBasis : "Pricing basis to be confirmed on enquiry"}
            </p>
            {v("priceValidity") && (
              <p className={`mt-1 text-xs ${vip ? "text-ivory/60" : "text-stone"}`}>
                Price valid {pkg.priceValidFrom ? `from ${formatDate(pkg.priceValidFrom)} ` : ""}until {formatDate(pkg.priceValidUntil)}
              </p>
            )}
            <p className={`mt-5 inline-block rounded-full px-3 py-1 text-xs font-medium ${vip ? "bg-gold-500/15 text-gold-300" : "bg-pine-50 text-pine-800"}`}>
              {publicStatusLabel(pkg)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {bookable && <Link href={`/packages/${pkg.slug}/book`} className={vip ? "btn-gold" : "btn-primary"}>Book Now</Link>}
              <Link href={`/enquire?package=${pkg.slug}`} className={bookable ? (vip ? "btn border border-ivory/25 text-ivory hover:bg-ivory/10" : "btn-outline") : vip ? "btn-gold" : "btn-primary"}>
                {confirmed ? "Ask a Question" : "Enquire for Full Details"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-pine-900/10 bg-sand/50">
        <div className="container-page py-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Booking &amp; payment</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-pine-900">Pay in instalments — no account needed</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {bookable ? (
                <Link href={`/packages/${pkg.slug}/book`} className="btn-primary">Book Now</Link>
              ) : (
                <Link href={`/enquire?package=${pkg.slug}`} className="btn-primary">Enquire for Full Details</Link>
              )}
              <Link href="/pay" className="btn-gold">Already booked? Make a Payment</Link>
            </div>
          </div>
          <PaymentSteps reveal />
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[2fr_1fr]">
        <div>
          {!confirmed && (
            <div className="mb-8 rounded-2xl border border-gold-500/40 bg-gold-100/60 p-5 text-sm text-ink/85">
              <p className="font-semibold text-pine-900">
                {pkg.status === "COMING_SOON" ? "Registration details coming soon" : "Full package details available on enquiry"}
              </p>
              <p className="mt-1">
                Our team is finalising the operational details for this package, and only information we have confirmed is
                shown below. You can still book now: our team will confirm the full package details and your total amount
                with you before you make any payment. No place is reserved until we confirm your booking.
              </p>
            </div>
          )}

          {pkg.images.length > 0 && (
            <div className="mb-8 grid gap-3 sm:grid-cols-2">
              {pkg.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt={img.alt} className={`w-full rounded-2xl object-cover ${i === 0 ? "aspect-[16/9] sm:col-span-2" : "aspect-[4/3]"}`} />
              ))}
            </div>
          )}

          {v("description") && (
            <Section title="About this package">
              <p className="prose-plain">{pkg.description}</p>
            </Section>
          )}

          {(v("season") || v("dates") || v("departureLocation")) && (
            <Section title="Season and travel dates">
              <dl className="grid gap-4 sm:grid-cols-3">
                {v("season") && <Fact k="Hajj season" val={pkg.season!} />}
                {v("dates") && <Fact k="Departure" val={formatDate(pkg.departureDate)} />}
                {v("dates") && <Fact k="Return" val={formatDate(pkg.returnDate)} />}
                {v("departureLocation") && <Fact k="Departing from" val={pkg.departureLocation!} />}
              </dl>
            </Section>
          )}

          {text.filter(([k]) => v(k)).map(([k, title, val]) => (
            <Section key={k} title={title}>
              <p className="prose-plain">{val}</p>
            </Section>
          ))}

          {(v("included") || v("excluded")) && (
            <Section title="What is included">
              <div className="grid gap-6 sm:grid-cols-2">
                {v("included") && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-pine-700">Included</h3>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {pkg.includedServices.map((s) => <li key={s} className="flex gap-2"><span className="text-pine-600">✓</span>{s}</li>)}
                    </ul>
                  </div>
                )}
                {v("excluded") && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-stone">Not included</h3>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {pkg.excludedServices.map((s) => <li key={s} className="flex gap-2"><span className="text-stone">–</span>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          )}

          {v("paymentSchedule") && (
            <Section title="Payment schedule"><p className="prose-plain">{pkg.paymentSchedule}</p></Section>
          )}
          {v("cancellationTerms") && (
            <Section title="Cancellation and refunds"><p className="prose-plain">{pkg.cancellationTerms}</p></Section>
          )}

          {(v("registration") || v("availability")) && (
            <Section title="Registration and availability">
              <dl className="grid gap-4 sm:grid-cols-3">
                {v("registration") && pkg.registrationOpens && <Fact k="Registration opens" val={formatDate(pkg.registrationOpens)} />}
                {v("registration") && <Fact k="Registration deadline" val={formatDate(pkg.registrationDeadline)} />}
                {v("availability") && pkg.capacity != null && <Fact k="Places offered" val={String(pkg.capacity)} />}
              </dl>
              {v("availability") && pkg.availabilityNote && <p className="prose-plain mt-3">{pkg.availabilityNote}</p>}
            </Section>
          )}

          {pkg.faqs.length > 0 && (
            <Section title="Frequently asked questions">
              <div className="divide-y divide-pine-900/10">
                {pkg.faqs.map((f) => (
                  <details key={f.id} className="group py-3">
                    <summary className="cursor-pointer list-none font-medium text-pine-900">
                      <span className="mr-2 inline-block text-gold-600 transition group-open:rotate-45">+</span>{f.question}
                    </summary>
                    <p className="prose-plain mt-2 pl-5 text-sm">{f.answer}</p>
                  </details>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="space-y-6" data-reveal style={{ "--d": "150ms" } as React.CSSProperties}>
          {pending.length > 0 && (
            <div className="card p-6">
              <h2 className="font-serif text-xl font-semibold text-pine-900">Details being confirmed</h2>
              <p className="mt-1 text-sm text-ink/70">Ask our team about any of the following:</p>
              <ul className="mt-3 space-y-1 text-sm text-ink/80">
                {pending.map((f) => <li key={f.key}>· {f.label}</li>)}
              </ul>
            </div>
          )}
          {pkg.documents.length > 0 && (
            <div className="card p-6">
              <h2 className="font-serif text-xl font-semibold text-pine-900">Brochures</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {pkg.documents.map((d) => (
                  <li key={d.id}><a href={d.url} target="_blank" rel="noopener" className="text-pine-700 underline">↓ {d.title}</a></li>
                ))}
              </ul>
            </div>
          )}
          <div className="card bg-pine-50 p-6">
            <h2 className="font-serif text-xl font-semibold text-pine-900">Speak with our team</h2>
            <p className="mt-1 text-sm text-ink/70">Individuals, families, groups and institutions are welcome to enquire.</p>
            <Link href={`/enquire?package=${pkg.slug}`} className="btn-primary mt-4">Enquire about {pkg.name}</Link>
          </div>
          <PriceNotice />
        </aside>
      </div>
    </>
  );
}

function Fact({ k, val }: { k: string; val: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-stone">{k}</dt>
      <dd className="mt-0.5 font-medium text-pine-900">{val}</dd>
    </div>
  );
}
