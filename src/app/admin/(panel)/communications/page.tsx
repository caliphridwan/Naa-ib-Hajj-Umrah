import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { Empty, humanize, PageHeader, Pill } from "@/components/admin/ui";

const TONE = { SENT: "green", LOGGED_ONLY: "gold", FAILED: "red", QUEUED: "grey" } as const;

export default async function Communications() {
  await requireAdmin();
  const rows = await prisma.communication.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const smtp = !!process.env.SMTP_HOST;
  return (
    <>
      <PageHeader title="Communications" subtitle="Every customer email sent in the company's name." />
      {!smtp && <p className="mb-6 rounded-xl bg-gold-100/60 p-4 text-sm">Email delivery is not configured (SMTP settings). Messages are recorded here as “Logged only” and are <strong>not</strong> delivered to customers.</p>}
      <div className="card divide-y divide-pine-900/5">
        {rows.length === 0 && <Empty>No messages yet.</Empty>}
        {rows.map((m) => (
          <details key={m.id} className="p-4">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
              <span><span className="font-medium">{m.subject}</span> <span className="text-stone">→ {m.toAddress}</span></span>
              <span className="flex items-center gap-2 text-xs text-stone"><Pill tone={TONE[m.status]}>{humanize(m.status)}</Pill>{formatDateTime(m.createdAt)}</span>
            </summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-sand/50 p-3 font-sans text-sm">{m.body}</pre>
            {m.error && <p className="mt-2 text-xs text-red-700">{m.error}</p>}
          </details>
        ))}
      </div>
    </>
  );
}
