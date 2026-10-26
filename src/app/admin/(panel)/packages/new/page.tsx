import { requireAdmin } from "@/lib/auth";
import { createPackage } from "@/lib/admin/package-actions";
import { Flash, PageHeader } from "@/components/admin/ui";

export default async function NewPackage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("ADMIN");
  return (
    <>
      <PageHeader title="New package" back={{ href: "/admin/packages", label: "Packages" }} subtitle="New packages start as hidden drafts." />
      <Flash {...await searchParams} />
      <form action={createPackage} className="card grid max-w-xl gap-4 p-6">
        <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" className="input" required /></div>
        <div><label className="label" htmlFor="slug">URL slug</label><input id="slug" name="slug" className="input" required placeholder="e.g. hajj-family" /></div>
        <div>
          <label className="label" htmlFor="tier">Tier</label>
          <select id="tier" name="tier" className="input">
            <option value="REGULAR">Regular</option><option value="STANDARD">Standard</option><option value="VIP">VIP</option>
          </select>
        </div>
        <div><label className="label" htmlFor="price">Price (NGN)</label><input id="price" name="price" className="input" required inputMode="decimal" placeholder="e.g. 9500000" /></div>
        <button className="btn-primary justify-self-start">Create draft</button>
      </form>
    </>
  );
}
