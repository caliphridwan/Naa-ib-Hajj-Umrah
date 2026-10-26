import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { PriceNotice } from "@/components/PriceNotice";
import { PaymentSteps } from "@/components/PaymentSteps";
import { getPublicPackage } from "@/lib/queries";
import { canRequestBooking, isConfirmedQuotation, isVerified } from "@/lib/packages";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export const metadata = { title: "Request a Booking" };

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const pkg = await getPublicPackage((await params).slug);
  if (!pkg) notFound();

  if (!canRequestBooking(pkg)) {
    return (
      <section className="container-page max-w-2xl py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold text-pine-900">Booking for {pkg.name} is closed</h1>
        <p className="mt-4 text-ink/70">
          The registration deadline for this package has passed. Please send us an enquiry and our team will advise you
          on the options available.
        </p>
        <Link href={`/enquire?package=${pkg.slug}`} className="btn-primary mt-8">Enquire for Full Details</Link>
      </section>
    );
  }

  const confirmed = isConfirmedQuotation(pkg);
  const v = (k: Parameters<typeof isVerified>[1]) => isVerified(pkg, k);
  const tbc = "To be confirmed";

  return (
    <section className="container-page grid gap-10 py-16 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <Link href={`/packages/${pkg.slug}`} className="text-sm text-stone hover:text-pine-700">← {pkg.name}</Link>
        <h1 className="mt-4 font-serif text-5xl font-semibold text-pine-900">Book {pkg.name}</h1>
        <p className="mt-3 text-ink/70">
          No account or payment is needed now. Submit your details and you&apos;ll get a private booking page. Once our team
          approves your booking and confirms the total, you can pay there in full or in instalments with Paystack.
        </p>
        <div className="mt-6"><PaymentSteps current={1} /></div>
        {!confirmed && (
          <p className="mt-6 rounded-xl border border-gold-500/40 bg-gold-100/60 p-4 text-sm text-ink/85">
            Some details of this package are still being finalised. Our team will confirm them, together with your total
            amount, before you make any payment.
          </p>
        )}
        <div className="card mt-8 p-6 sm:p-8">
          <BookingForm slug={pkg.slug} confirmed={confirmed} />
        </div>
      </div>
      <aside className="space-y-4 lg:pt-24">
        <div className="card p-6">
          <p className="eyebrow">Quotation summary</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-pine-900">{pkg.name}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row k="Starting price" v={formatMoney(pkg.price, pkg.currency)} />
            <Row k="Pricing basis" v={v("pricingBasis") ? pkg.pricingBasis! : tbc} />
            <Row k="Season" v={v("season") ? pkg.season! : tbc} />
            <Row k="Departure" v={v("dates") ? formatDate(pkg.departureDate) : tbc} />
            <Row k="Return" v={v("dates") ? formatDate(pkg.returnDate) : tbc} />
            <Row k="Departing from" v={v("departureLocation") ? pkg.departureLocation! : tbc} />
            {v("priceValidity") && <Row k="Price valid until" v={formatDate(pkg.priceValidUntil)} />}
            {v("registration") && <Row k="Registration deadline" v={formatDate(pkg.registrationDeadline)} />}
          </dl>
          <Link href={`/packages/${pkg.slug}`} className="mt-4 inline-block text-sm text-pine-700 underline">
            View full package details
          </Link>
        </div>
        <PriceNotice />
      </aside>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
