import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { PageHeader } from "@/components/admin/ui";

export default async function AuditPage() {
  await requireAdmin("ADMIN");
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { actor: { select: { name: true } } } });
  return (
    <>
      <PageHeader title="Audit log" subtitle="Administrative actions, including every price change and publication." />
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap text-xs">{formatDateTime(r.createdAt)}</td>
                <td>{r.actor?.name ?? "System"}</td>
                <td className="font-mono text-xs">{r.action}</td>
                <td className="max-w-md truncate font-mono text-xs text-stone" title={JSON.stringify(r.details)}>{r.details ? JSON.stringify(r.details) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
