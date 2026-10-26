import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { payPath } from "@/lib/paylink";

export const metadata = { title: "Track an Enquiry or Booking", robots: { index: false } };

const INQUIRY_LABEL: Record<string, string> = {
  NEW: "Received — awaiting response",
  CONTACTED: "Our team has contacted you",
  IN_PROGRESS: "In progress",
  CONVERTED: "Converted to a booking",
  CLOSED: "Closed",
};

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ ref?: string; email?: string }> }) {
  const sp = await searchParams;
  const ref = sp.ref?.trim().toUpperCase();
  const email = sp.email?.trim().toLowerCase();

  let result: React.ReactNode = null;
  if (ref && email) {
    if (ref.startsWith("NAB-")) {
      const b = await prisma.booking.findFirst({ where: { reference: ref, customer: { email } }, select: { reference: true } });
      if (b) redirect(payPath(b.reference)); // bookings live on their private booking & payment page
    } else if (ref.startsWith("ENQ-")) {
      const inquiry = await prisma.inquiry.findFirst({ where: { reference: ref, customer: { email } }, include: { package: true } });
      if (inquiry)
        result = (
          <div className="card p-6">
            <p className="eyebrow">Enquiry</p>
            <h2 className="mt-1 font-mono text-2xl text-pine-900">{inquiry.reference}</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-stone">Status</dt><dd className="font-medium">{INQUIRY_LABEL[inquiry.status]}</dd></div>
              <div><dt className="text-stone">Package</dt><dd className="font-medium">{inquiry.package?.name ?? "General enquiry"}</dd></div>
              <div><dt className="text-stone">Submitted</dt><dd className="font-medium">{formatDate(inquiry.createdAt)}</dd></div>
            </dl>
          </div>
        );
    }
    result ??= <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">We could not find a record matching that reference and email address.</p>;
  }

  return (
    <section className="container-page max-w-3xl py-16">
      <p className="eyebrow">Track a request</p>
      <h1 className="mt-3 font-serif text-5xl font-semibold text-pine-900">Check your status</h1>
      <p className="mt-3 text-ink/70">
        Enter your enquiry (ENQ-) or booking (NAB-) reference and the email address you used. No account is needed.
        To pay for a booking, go to <Link href="/pay" className="font-medium text-pine-700 underline">Make a Payment</Link>.
      </p>
      <form className="card mt-8 grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="ref">Reference</label>
          <input id="ref" name="ref" className="input font-mono uppercase" defaultValue={sp.ref} required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" defaultValue={sp.email} required />
        </div>
        <button className="btn-primary">Check</button>
      </form>
      <div className="mt-8">{result}</div>
    </section>
  );
}
