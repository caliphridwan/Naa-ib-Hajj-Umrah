import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { updateSettings } from "@/lib/admin/owner-actions";
import { Card, Flash, PageHeader } from "@/components/admin/ui";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("OWNER");
  const s = await getSettings();
  const F = ({ name, label, hint, area }: { name: keyof typeof s; label: string; hint?: string; area?: boolean }) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {area ? <textarea id={name} name={name} className="input" rows={3} defaultValue={(s[name] as string) ?? ""} /> : <input id={name} name={name} className="input" defaultValue={(s[name] as string) ?? ""} />}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
  return (
    <>
      <PageHeader title="Business settings" subtitle="The identity shown across the website, emails and receipts." />
      <Flash {...await searchParams} />
      <form action={updateSettings} className="space-y-6">
        <p className="rounded-xl border border-gold-500/30 bg-gold-100/50 p-4 text-sm">
          Only enter official details that the company has confirmed. Leave a field empty rather than guessing — empty fields
          are simply not shown. Do not enter registration numbers, licences or affiliations that have not been verified.
        </p>
        <Card title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <F name="displayName" label="Display name" hint="Temporary: “Naa'ib Associates” until confirmed." />
            <F name="legalName" label="Legal name" />
            <div className="sm:col-span-2"><F name="tagline" label="Homepage tagline (optional)" /></div>
            <div className="sm:col-span-2"><F name="logoUrl" label="Official logo URL (optional)" hint="Leave empty to use the temporary wordmark." /></div>
            <F name="registrationNumber" label="Company registration (as it should appear)" hint="e.g. “RC 0000000” — only once verified." />
            <F name="licenceDetails" label="Licensing details" area />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="identityConfirmed" defaultChecked={s.identityConfirmed} className="accent-pine-700" />
              The company has confirmed its display name, logo and legal identity
            </label>
          </div>
        </Card>
        <Card title="Contact details">
          <div className="grid gap-4 sm:grid-cols-2">
            <F name="phone" label="Telephone" />
            <F name="whatsapp" label="WhatsApp" />
            <F name="email" label="Email" />
            <F name="officeHours" label="Office hours" />
            <div className="sm:col-span-2"><F name="addressLine" label="Office address" /></div>
            <F name="city" label="City" />
            <F name="country" label="Country" />
          </div>
        </Card>
        <Card title="Online payments (Paystack)">
          <p className="mb-3 text-sm text-ink/80">
            Status: {process.env.PAYSTACK_SECRET_KEY ? <strong className="text-pine-700">connected{process.env.PAYSTACK_SECRET_KEY.startsWith("sk_test") ? " (TEST mode)" : ""}</strong> : <strong className="text-gold-700">not configured — set PAYSTACK_SECRET_KEY</strong>}.
            Customers can pay in instalments once a booking is “Awaiting deposit” or “Confirmed” and has an agreed total.
          </p>
          <label className="label" htmlFor="minOnlineInstalment">Minimum online instalment (₦, optional)</label>
          <input id="minOnlineInstalment" name="minOnlineInstalment" className="input max-w-60" inputMode="decimal" defaultValue={s.minOnlineInstalment?.toString() ?? ""} />
          <p className="hint">Leave empty for no minimum (Paystack&apos;s own ₦100 minimum still applies). A customer can always pay off a remaining balance smaller than this.</p>
        </Card>
        <Card title="Receipts">
          <F name="receiptFooter" label="Receipt footer text (optional)" area hint="e.g. bank details or a payment policy statement, as confirmed by the company." />
        </Card>
        <button className="btn-primary">Save settings</button>
      </form>
    </>
  );
}
