import { requireAdmin } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/admin/auth-actions";
import { Card, Flash, humanize, PageHeader } from "@/components/admin/ui";

export default async function Account({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requireAdmin();
  return (
    <>
      <PageHeader title="My account" subtitle={`${me.name} · ${me.email} · ${humanize(me.role)}`} />
      <Flash {...await searchParams} />
      <Card title="Change password" className="max-w-md">
        <form action={changeOwnPassword} className="space-y-3">
          <input name="current" type="password" className="input" placeholder="Current password" required autoComplete="current-password" />
          <input name="next" type="password" className="input" placeholder="New password (10+ characters)" required autoComplete="new-password" />
          <input name="confirm" type="password" className="input" placeholder="Confirm new password" required autoComplete="new-password" />
          <button className="btn-primary btn-sm">Update password</button>
        </form>
      </Card>
    </>
  );
}
