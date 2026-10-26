import Link from "next/link";

export const metadata = { title: "Enquiry received" };

export default async function Received({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <section className="container-page max-w-2xl py-24 text-center">
      <p className="eyebrow">Thank you</p>
      <h1 className="mt-3 font-serif text-5xl font-semibold text-pine-900">Your enquiry has been received</h1>
      {ref && (
        <p className="mt-6 text-ink/80">
          Your reference is <strong className="font-mono text-pine-800">{ref}</strong>. Please keep it for your records.
        </p>
      )}
      <p className="mt-3 text-ink/70">A member of our team will be in touch. An enquiry does not reserve a Hajj place.</p>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/packages" className="btn-outline">Back to packages</Link>
        <Link href="/booking-status" className="btn-ghost">Track an enquiry</Link>
      </div>
    </section>
  );
}
