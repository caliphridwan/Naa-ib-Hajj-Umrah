"use client";

import { useActionState } from "react";
import { submitInquiry } from "@/lib/public-actions";
import { ContactFields } from "./ContactFields";
import { Field, FormError } from "./Field";

export function EnquiryForm({
  packages,
  defaultPackage,
  defaultType,
}: {
  packages: { slug: string; name: string }[];
  defaultPackage?: string;
  defaultType?: string;
}) {
  const [state, action, pending] = useActionState(submitInquiry, undefined);
  const e = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  return (
    <form action={action} className="space-y-5">
      <FormError message={state?.error} />
      <ContactFields errors={e} values={v} defaultType={defaultType} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Package of interest" name="packageSlug">
          <select id="packageSlug" name="packageSlug" className="input" defaultValue={v.packageSlug ?? defaultPackage ?? ""}>
            <option value="">Not sure yet / general enquiry</option>
            {packages.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Number of travellers" name="travellersCount" error={e.travellersCount}>
          <input id="travellersCount" name="travellersCount" type="number" min={1} max={1000} defaultValue={v.travellersCount ?? 1} className="input" required />
        </Field>
      </div>
      <Field label="Preferred way to contact you" name="preferredContact">
        <select id="preferredContact" name="preferredContact" className="input" defaultValue={v.preferredContact ?? "phone"}>
          <option value="phone">Phone call</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
      </Field>
      <Field label="Your enquiry" name="message" error={e.message} hint="Let us know anything that will help us advise you — preferred season, special needs, group size and so on.">
        <textarea id="message" name="message" className="input" rows={5} required maxLength={4000} defaultValue={v.message} />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" className="mt-1 accent-pine-700" required defaultChecked={v.consent === "on"} />
        <span>I agree to be contacted about this enquiry and for my details to be stored for that purpose.{e.consent && <span className="block text-xs text-red-700">{e.consent}</span>}</span>
      </label>
      <button className="btn-primary" disabled={pending}>{pending ? "Sending…" : "Send Enquiry"}</button>
      <p className="text-xs text-stone">An enquiry does not reserve a Hajj place.</p>
    </form>
  );
}
