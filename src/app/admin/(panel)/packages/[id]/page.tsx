import Link from "next/link";
import { notFound } from "next/navigation";
import type { Package } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, hasRole } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { formatDateTime, toDateInput } from "@/lib/dates";
import { bookableIssues, BOOKABLE_REQUIREMENTS, hasValue, STATUS_LABEL, TIER_LABEL, type DetailKey } from "@/lib/packages";
import * as A from "@/lib/admin/package-actions";
import { Card, Flash, PACKAGE_TONE, PageHeader, Pill } from "@/components/admin/ui";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function EditPackage({ params, searchParams }: Props) {
  const me = await requireAdmin();
  const { id } = await params;
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      documents: true,
      faqs: { orderBy: { sortOrder: "asc" } },
      priceChanges: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { name: true } } } },
    },
  });
  if (!pkg) notFound();
  const canEdit = hasRole(me, "ADMIN");
  const issues = bookableIssues(pkg);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/packages", label: "Packages" }}
        title={pkg.name}
        subtitle={<span className="flex items-center gap-2">{TIER_LABEL[pkg.tier]} tier · <Pill tone={PACKAGE_TONE[pkg.status]}>{STATUS_LABEL[pkg.status]}</Pill></span>}
        actions={<Link href={`/packages/${pkg.slug}`} target="_blank" className="btn-outline">View public page ↗</Link>}
      />
      <Flash {...await searchParams} />
      {!canEdit && <p className="mb-6 rounded-xl bg-sand p-4 text-sm">You have view-only access to packages. Pricing and publishing require an Admin or Owner account.</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <form action={A.savePackageDetails.bind(null, pkg.id)} className="space-y-6">
          <fieldset disabled={!canEdit} className="space-y-6">
            <p className="rounded-xl border border-gold-500/30 bg-gold-100/50 p-4 text-sm text-ink/80">
              Enter details exactly as confirmed by the business. Tick <strong>Verified</strong> only when a detail has been
              confirmed — unverified details are never shown to the public. Required for bookable status:{" "}
              {BOOKABLE_REQUIREMENTS.length} details marked <span className="text-red-700">*</span>.
            </p>

            <Card title="Overview">
              <div className="grid gap-4">
                <Text label="Package name" name="name" value={pkg.name} />
                <Text label="Short tagline (optional, shown on cards)" name="tagline" value={pkg.tagline} />
                <Area label="Package description" name="description" k="description" pkg={pkg} />
                <Text label="Display order" name="sortOrder" value={String(pkg.sortOrder)} type="number" />
              </div>
            </Card>

            <Card title="Pricing basis & validity">
              <div className="grid gap-4">
                <Text label="Pricing basis" name="pricingBasis" k="pricingBasis" pkg={pkg} value={pkg.pricingBasis} hint="e.g. per pilgrim, room sharing arrangement — as confirmed by the business." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label="Price valid from (optional)" name="priceValidFrom" value={toDateInput(pkg.priceValidFrom)} type="date" />
                  <Text label="Price valid until" name="priceValidUntil" k="priceValidity" pkg={pkg} value={toDateInput(pkg.priceValidUntil)} type="date" />
                </div>
              </div>
            </Card>

            <Card title="Season & dates">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Text label="Applicable Hajj season" name="season" k="season" pkg={pkg} value={pkg.season} hint="e.g. Hajj 1448 AH (2027)" /></div>
                <Text label="Departure date" name="departureDate" k="dates" pkg={pkg} value={toDateInput(pkg.departureDate)} type="date" />
                <Text label="Return date" name="returnDate" value={toDateInput(pkg.returnDate)} type="date" />
                <div className="sm:col-span-2"><Text label="Departure location" name="departureLocation" k="departureLocation" pkg={pkg} value={pkg.departureLocation} /></div>
              </div>
            </Card>

            <Card title="Arrangements">
              <div className="grid gap-4">
                <Area label="Accommodation" name="accommodation" k="accommodation" pkg={pkg} />
                <Area label="Flight arrangements" name="flights" k="flights" pkg={pkg} />
                <Area label="Ground transportation" name="groundTransport" k="groundTransport" pkg={pkg} />
                <Area label="Meals" name="meals" k="meals" pkg={pkg} />
                <Area label="Visa or permit assistance" name="visaAssistance" k="visaAssistance" pkg={pkg} hint="Only describe services the company is legally authorised to provide." />
              </div>
            </Card>

            <Card title="Inclusions & exclusions">
              <div className="grid gap-4 sm:grid-cols-2">
                <Area label="Included services (one per line)" name="includedServices" k="included" pkg={pkg} value={pkg.includedServices.join("\n")} rows={7} />
                <Area label="Excluded services (one per line)" name="excludedServices" k="excluded" pkg={pkg} value={pkg.excludedServices.join("\n")} rows={7} />
              </div>
            </Card>

            <Card title="Payment & cancellation terms">
              <div className="grid gap-4">
                <Area label="Payment schedule" name="paymentSchedule" k="paymentSchedule" pkg={pkg} />
                <Area label="Cancellation and refund terms" name="cancellationTerms" k="cancellationTerms" pkg={pkg} rows={5} />
              </div>
            </Card>

            <Card title="Registration & availability">
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Registration opens (optional)" name="registrationOpens" value={toDateInput(pkg.registrationOpens)} type="date" />
                <Text label="Registration deadline" name="registrationDeadline" k="registration" pkg={pkg} value={toDateInput(pkg.registrationDeadline)} type="date" />
                <div className="sm:col-span-2"><Area label="Availability note" name="availabilityNote" k="availability" pkg={pkg} hint="Do not state availability that has not been confirmed." rows={2} /></div>
                <Text label="Places offered (optional)" name="capacity" value={pkg.capacity?.toString() ?? ""} type="number" />
              </div>
            </Card>

            {canEdit && (
              <div className="sticky bottom-4 z-10 flex justify-end">
                <button className="btn-primary shadow-lg">Save package details</button>
              </div>
            )}
          </fieldset>
        </form>

        <div className="space-y-6">
          <Card title="Price">
            <p className="font-serif text-4xl font-semibold text-pine-900">{formatMoney(pkg.price, pkg.currency)}</p>
            <p className="mt-1 text-sm text-stone">{pkg.pricingBasis ?? "Pricing basis not entered"}</p>
            {pkg.priceConfirmedAt ? (
              <p className="mt-3 text-sm text-pine-700">✓ Confirmed by {pkg.priceConfirmedBy} on {formatDateTime(pkg.priceConfirmedAt)}</p>
            ) : (
              <p className="mt-3 text-sm text-gold-700">Not yet confirmed as a final quotation.</p>
            )}
            {canEdit && (
              <>
                {pkg.priceConfirmedAt ? (
                  <form action={A.unconfirmPrice.bind(null, pkg.id)} className="mt-3"><button className="btn-outline btn-sm">Withdraw confirmation</button></form>
                ) : (
                  <form action={A.confirmPrice.bind(null, pkg.id)} className="mt-3">
                    <button className="btn-primary btn-sm">Confirm {formatMoney(pkg.price, pkg.currency)} as final</button>
                  </form>
                )}
                <details className="mt-5 border-t border-pine-900/10 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-pine-800">Change price…</summary>
                  <form action={A.changePrice.bind(null, pkg.id)} className="mt-3 space-y-3">
                    <div><label className="label" htmlFor="price">New price ({pkg.currency})</label><input id="price" name="price" className="input" inputMode="decimal" required /></div>
                    <div><label className="label" htmlFor="confirmText">Type the new price as it should appear</label><input id="confirmText" name="confirmText" className="input" placeholder="e.g. ₦9,500,000" required /></div>
                    <div><label className="label" htmlFor="reason">Reason</label><input id="reason" name="reason" className="input" required /></div>
                    <button className="btn-danger btn-sm">Change price</button>
                    <p className="hint">The change is recorded in price history and the price must be re-confirmed.</p>
                  </form>
                </details>
              </>
            )}
          </Card>

          <Card title="Publishing">
            <ul className="space-y-1.5 text-sm">
              <Check ok={!!pkg.priceConfirmedAt}>Price confirmed</Check>
              {BOOKABLE_REQUIREMENTS.map((k) => {
                const has = hasValue(pkg, k);
                const ver = pkg.verifiedFields.includes(k);
                return <Check key={k} ok={has && ver} partial={has && !ver}>{LABELS[k]}{has && !ver ? " (not verified)" : ""}</Check>;
              })}
            </ul>
            {issues.filter((i) => /passed|before/.test(i.message)).map((i) => (
              <p key={i.message} className="mt-2 text-xs text-red-800">{i.message}</p>
            ))}
            {canEdit && (
              <form action={A.setPackageStatus.bind(null, pkg.id)} className="mt-5 space-y-3 border-t border-pine-900/10 pt-4">
                <label className="label" htmlFor="status">Public status</label>
                <select id="status" name="status" className="input" defaultValue={pkg.status}>
                  <option value="DRAFT">Draft — hidden</option>
                  <option value="ENQUIRY">Visible — Full details on enquiry (Book Now open)</option>
                  <option value="COMING_SOON">Visible — Registration Details Coming Soon (Book Now open)</option>
                  <option value="BOOKABLE" disabled={issues.length > 0}>Bookable — confirmed quotation{issues.length ? " (requirements outstanding)" : ""}</option>
                  <option value="ARCHIVED">Archived — hidden</option>
                </select>
                <button className="btn-primary btn-sm">Update status</button>
                <p className="hint">Customers can click Book Now on any visible package. Bookings are requests: you confirm details and the total before payment opens. “Bookable” additionally shows the package as a fully confirmed quotation.</p>
              </form>
            )}
          </Card>

          <Card title="Price history">
            <ol className="space-y-3 text-sm">
              {pkg.priceChanges.map((c) => (
                <li key={c.id} className="border-l-2 border-gold-300 pl-3">
                  <p className="font-medium">{c.oldPrice ? `${formatMoney(c.oldPrice, c.currency)} → ` : ""}{formatMoney(c.newPrice, c.currency)}</p>
                  <p className="text-xs text-stone">{c.reason} · {c.changedBy?.name ?? "System"} · {formatDateTime(c.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <div id="media" className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Photographs">
          <div className="grid grid-cols-2 gap-3">
            {pkg.images.map((img) => (
              <figure key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt} className="aspect-[4/3] w-full rounded-lg object-cover" />
                <figcaption className="mt-1 truncate text-xs text-stone">{img.alt}</figcaption>
                {canEdit && <form action={A.deleteImage.bind(null, pkg.id, img.id)}><button className="text-xs text-red-700 hover:underline">Remove</button></form>}
              </figure>
            ))}
          </div>
          {pkg.images.length === 0 && <p className="text-sm text-stone">No photographs yet. Only upload images the company has the right to use.</p>}
          {canEdit && (
            <form action={A.addImage.bind(null, pkg.id)} className="mt-4 space-y-2 border-t border-pine-900/10 pt-4">
              <input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="text-sm" required />
              <input name="alt" className="input" placeholder="Describe the photo" required />
              <button className="btn-outline btn-sm">Upload photo</button>
            </form>
          )}
        </Card>
        <Card title="Brochures">
          <ul className="space-y-2 text-sm">
            {pkg.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2">
                <a href={d.url} target="_blank" rel="noopener" className="text-pine-700 underline">{d.title}</a>
                {canEdit && <form action={A.deleteDocument.bind(null, pkg.id, d.id)}><button className="text-xs text-red-700 hover:underline">Remove</button></form>}
              </li>
            ))}
          </ul>
          {pkg.documents.length === 0 && <p className="text-sm text-stone">No brochures yet.</p>}
          {canEdit && (
            <form action={A.addDocument.bind(null, pkg.id)} className="mt-4 space-y-2 border-t border-pine-900/10 pt-4">
              <input type="file" name="file" accept="application/pdf" className="text-sm" required />
              <input name="title" className="input" placeholder="Brochure title" required />
              <button className="btn-outline btn-sm">Upload PDF</button>
            </form>
          )}
        </Card>
      </div>

      <div id="faqs" className="mt-6">
        <Card title="Frequently asked questions">
          <div className="divide-y divide-pine-900/10">
            {pkg.faqs.map((f) => (
              <div key={f.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{f.question} {!f.published && <Pill>Hidden</Pill>}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-ink/75">{f.answer}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <form action={A.toggleFaq.bind(null, pkg.id, f.id)}><button className="btn-ghost btn-sm">{f.published ? "Hide" : "Publish"}</button></form>
                    <form action={A.deleteFaq.bind(null, pkg.id, f.id)}><button className="btn-danger btn-sm">Delete</button></form>
                  </div>
                )}
              </div>
            ))}
          </div>
          {pkg.faqs.length === 0 && <p className="text-sm text-stone">No FAQs yet.</p>}
          {canEdit && (
            <form action={A.addFaq.bind(null, pkg.id)} className="mt-4 grid gap-2 border-t border-pine-900/10 pt-4">
              <input name="question" className="input" placeholder="Question" required />
              <textarea name="answer" className="input" placeholder="Answer" rows={3} required />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked className="accent-pine-700" /> Publish immediately</label>
              <button className="btn-outline btn-sm justify-self-start">Add FAQ</button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}

const LABELS: Record<DetailKey, string> = {
  description: "Description", pricingBasis: "Pricing basis", priceValidity: "Price validity", season: "Hajj season",
  dates: "Departure & return dates", departureLocation: "Departure location", accommodation: "Accommodation", flights: "Flights",
  groundTransport: "Ground transport", meals: "Meals", visaAssistance: "Visa / permit assistance", included: "Included services",
  excluded: "Excluded services", paymentSchedule: "Payment schedule", cancellationTerms: "Cancellation & refund terms",
  registration: "Registration deadline", availability: "Availability",
};

function Check({ ok, partial, children }: { ok: boolean; partial?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className={ok ? "text-pine-600" : partial ? "text-gold-600" : "text-red-700"}>{ok ? "✓" : partial ? "◐" : "✗"}</span>
      <span className={ok ? "" : "text-ink/70"}>{children}</span>
    </li>
  );
}

function Verify({ k, pkg }: { k: DetailKey; pkg: Package }) {
  const required = BOOKABLE_REQUIREMENTS.includes(k);
  return (
    <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-pine-800">
      <input type="checkbox" name="verified" value={k} defaultChecked={pkg.verifiedFields.includes(k)} className="accent-pine-700" />
      Verified{required && <span className="text-red-700">*</span>}
    </label>
  );
}

function Text({ label, name, value, type = "text", hint, k, pkg }: { label: string; name: string; value?: string | null; type?: string; hint?: string; k?: DetailKey; pkg?: Package }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="text-sm font-medium" htmlFor={name}>{label}</label>
        {k && pkg && <Verify k={k} pkg={pkg} />}
      </div>
      <input id={name} name={name} type={type} defaultValue={value ?? ""} className="input" />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

function Area({ label, name, k, pkg, value, hint, rows = 3 }: { label: string; name: string; k: DetailKey; pkg: Package; value?: string; hint?: string; rows?: number }) {
  const v = value ?? ((pkg as Record<string, unknown>)[name] as string | null) ?? "";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="text-sm font-medium" htmlFor={name}>{label}</label>
        <Verify k={k} pkg={pkg} />
      </div>
      <textarea id={name} name={name} defaultValue={v} rows={rows} className="input" />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
