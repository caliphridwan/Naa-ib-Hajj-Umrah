import { EnquiryForm } from "@/components/EnquiryForm";
import { getPublicPackages } from "@/lib/queries";

export const metadata = { title: "Make an Enquiry" };

export default async function EnquirePage({ searchParams }: { searchParams: Promise<{ package?: string; type?: string }> }) {
  const sp = await searchParams;
  const packages = await getPublicPackages();
  return (
    <section className="container-page grid gap-12 py-16 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="eyebrow">Enquiries</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold text-pine-900">How can we help?</h1>
        <p className="mt-4 text-ink/70">
          Whether you are travelling alone, with family, organising a group or enquiring on behalf of an institution, our
          team will respond with the information and options we can offer.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-ink/80">
          <li>· You will receive a reference number for your enquiry.</li>
          <li>· We will contact you using your preferred method.</li>
          <li>· An enquiry does not reserve a Hajj place or commit you to any payment.</li>
        </ul>
      </div>
      <div className="card p-6 sm:p-8">
        <EnquiryForm
          packages={packages.map((p) => ({ slug: p.slug, name: p.name }))}
          defaultPackage={sp.package}
          defaultType={sp.type}
        />
      </div>
    </section>
  );
}
