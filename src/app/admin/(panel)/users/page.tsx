import { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { createUser, updateUser } from "@/lib/admin/owner-actions";
import { Card, Flash, humanize, PageHeader } from "@/components/admin/ui";

const ROLE_HELP: Record<AdminRole, string> = {
  OWNER: "Everything, including settings, staff accounts and voiding receipts",
  ADMIN: "Packages, pricing, publishing, bookings and payments",
  STAFF: "Enquiries, bookings (status & notes) and customer messages",
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("OWNER");
  const users = await prisma.adminUser.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return (
    <>
      <PageHeader title="Staff accounts" subtitle="Only the company's own team has access. There is no public vendor or agent registration." />
      <Flash {...await searchParams} />
      <Card title="Roles" className="mb-6">
        <ul className="space-y-1 text-sm">{Object.entries(ROLE_HELP).map(([r, h]) => <li key={r}><strong>{humanize(r)}:</strong> {h}</li>)}</ul>
      </Card>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Last sign in</th><th>Role / access</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                <td>{u.name}<div className="text-xs text-stone">{u.email}</div></td>
                <td className="text-xs">{formatDateTime(u.lastLoginAt)}</td>
                <td>
                  <form action={updateUser.bind(null, u.id)} className="flex flex-wrap items-center gap-2">
                    <select name="role" defaultValue={u.role} className="input w-28">{Object.values(AdminRole).map((r) => <option key={r} value={r}>{humanize(r)}</option>)}</select>
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="active" defaultChecked={u.active} className="accent-pine-700" /> Active</label>
                    <input name="password" type="password" placeholder="Reset password" className="input w-40" autoComplete="new-password" />
                    <button className="btn-outline btn-sm">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title="Add a staff member" className="mt-6">
        <form action={createUser} className="grid gap-3 sm:grid-cols-2">
          <input name="name" className="input" placeholder="Full name" required />
          <input name="email" type="email" className="input" placeholder="Email" required />
          <select name="role" className="input" defaultValue="STAFF">{Object.values(AdminRole).map((r) => <option key={r} value={r}>{humanize(r)}</option>)}</select>
          <input name="password" type="password" className="input" placeholder="Temporary password (10+ chars)" required autoComplete="new-password" />
          <button className="btn-primary btn-sm justify-self-start">Create account</button>
        </form>
      </Card>
    </>
  );
}
