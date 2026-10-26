import Link from "next/link";
import { prisma } from "@/lib/db";
import { validPayToken } from "@/lib/paylink";
import { BookingAccount } from "@/components/BookingAccount";

export const metadata = { title: "My Booking & Payments", robots: { index: false } };

type Props = { params: Promise<{ ref: string }>; searchParams: Promise<{ t?: string; new?: string; paid?: string; payerror?: string }> };

export default async function PayPage({ params, searchParams }: Props) {
  const ref = decodeURIComponent((await params).ref).toUpperCase();
  const sp = await searchParams;
  const booking = validPayToken(ref, sp.t)
    ? await prisma.booking.findUnique({ where: { reference: ref }, include: { package: true, customer: true, payments: true } })
    : null;

  if (!booking) {
    return (
      <section className="container-page max-w-xl py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold text-pine-900">This payment link is not valid</h1>
        <p className="mt-4 text-ink/70">Please use the link from your email, or find your booking with your reference and email address.</p>
        <Link href="/pay" className="btn-primary mt-8">Find my booking</Link>
      </section>
    );
  }

  return (
    <section className="container-page max-w-3xl py-12">
      <BookingAccount booking={booking} token={sp.t!} flash={{ isNew: !!sp.new, paid: sp.paid, payerror: sp.payerror }} />
    </section>
  );
}
