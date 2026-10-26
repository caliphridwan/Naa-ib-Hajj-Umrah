import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { payPath } from "@/lib/paylink";
import { PaymentSteps } from "@/components/PaymentSteps";

export const metadata = { title: "Make a Payment" };

export default async function FindBookingToPay({ searchParams }: { searchParams: Promise<{ ref?: string; email?: string }> }) {
  const sp = await searchParams;
  const ref = sp.ref?.trim().toUpperCase();
  const email = sp.email?.trim().toLowerCase();
  let notFound = false;
  if (ref && email) {
    const b = await prisma.booking.findFirst({ where: { reference: ref, customer: { email } }, select: { reference: true } });
    if (b) redirect(payPath(b.reference) + "#pay");
    notFound = true;
  }

  return (
    <section className="container-page py-16">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Payments</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold text-pine-900">Make a payment</h1>
        <p className="mt-3 text-ink/70">
          Pay for your booking in full or in instalments. <strong>No account is needed</strong> — just enter your booking
          reference (it starts with NAB-) and the email address you used when booking.
        </p>
        <form className="card mt-8 grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="label" htmlFor="ref">Booking reference</label>
            <input id="ref" name="ref" className="input font-mono uppercase" placeholder="NAB-2026-XXXXXX" defaultValue={sp.ref} required />
          </div>
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" className="input" defaultValue={sp.email} required />
          </div>
          <button className="btn-primary">Continue</button>
        </form>
        {notFound && (
          <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            We couldn&apos;t find a booking with that reference and email. Check your booking confirmation email, or{" "}
            <Link href="/enquire" className="underline">contact us</Link>.
          </p>
        )}
        <p className="mt-6 text-sm text-ink/70">
          Haven&apos;t booked yet? <Link href="/packages" className="font-medium text-pine-700 underline">Choose a Hajj package</Link> and request a booking first.
        </p>
      </div>
      <div className="mx-auto mt-14 max-w-5xl">
        <h2 className="mb-4 text-center font-serif text-2xl font-semibold text-pine-900">How booking &amp; payment works</h2>
        <PaymentSteps />
      </div>
    </section>
  );
}
