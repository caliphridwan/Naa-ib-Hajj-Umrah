import { PackageCard } from "@/components/PackageCard";
import { PriceNotice } from "@/components/PriceNotice";
import { getPublicPackages } from "@/lib/queries";

export const metadata = { title: "Hajj Packages" };

export default async function PackagesPage() {
  const packages = await getPublicPackages();
  return (
    <section className="container-page py-16">
      <p className="eyebrow">Hajj Packages</p>
      <h1 className="mt-3 font-serif text-5xl font-semibold text-pine-900">Our Hajj packages</h1>
      <p className="mt-4 max-w-2xl text-ink/70">
        Each package is operated directly by our team. Where a package shows &ldquo;Enquire for Full Details&rdquo;, its
        itinerary and inclusions are still being finalised — contact us and we will share the latest confirmed
        information.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {packages.map((p) => (
          <PackageCard key={p.id} pkg={p} />
        ))}
      </div>
      <PriceNotice className="mt-8 max-w-3xl" />
    </section>
  );
}
