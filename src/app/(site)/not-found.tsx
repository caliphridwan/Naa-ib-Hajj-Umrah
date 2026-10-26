import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-page max-w-xl py-24 text-center">
      <h1 className="font-serif text-5xl font-semibold text-pine-900">Page not found</h1>
      <p className="mt-4 text-ink/70">The page you are looking for is not available.</p>
      <Link href="/" className="btn-primary mt-8">Return home</Link>
    </section>
  );
}
