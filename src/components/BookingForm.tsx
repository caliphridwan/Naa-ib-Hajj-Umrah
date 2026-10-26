"use client";

import { useActionState } from "react";
import { submitBookingRequest } from "@/lib/public-actions";
import { ContactFields } from "./ContactFields";
import { Field, FormError } from "./Field";

export function BookingForm({ slug, confirmed }: { slug: string; confirmed: boolean }) {
  const [state, action, pending] = useActionState(submitBookingRequest, undefined);
  const e = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="packageSlug" value={slug} />
      <FormError message={state?.error} />
      <ContactFields errors={e} values={v} />
      <Field label="Number of travellers" name="travellersCount" error={e.travellersCount}>
        <input id="travellersCount" name="travellersCount" type="number" min={1} max={500} defaultValue={v.travellersCount ?? 1} className="input max-w-32" required />
      </Field>
      <Field label="Traveller names" name="travellerNames" error={e.travellerNames} hint="One per line, exactly as written in each passport. Put the lead traveller first.">
        <textarea id="travellerNames" name="travellerNames" className="input" rows={4} required defaultValue={v.travellerNames} />
      </Field>
      <Field label="Special requests or needs (optional)" name="specialRequests">
        <textarea id="specialRequests" name="specialRequests" className="input" rows={3} maxLength={4000} defaultValue={v.specialRequests} />
      </Field>
      <div className="space-y-3 rounded-xl bg-sand/70 p-4 text-sm">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="ackNotConfirmed" className="mt-1 accent-pine-700" required defaultChecked={v.ackNotConfirmed === "on"} />
          <span>I understand this is a booking <strong>request</strong>. My Hajj place is not secured until it is confirmed to me in writing.{e.ackNotConfirmed && <span className="block text-xs text-red-700">{e.ackNotConfirmed}</span>}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="ackPrice" className="mt-1 accent-pine-700" required defaultChecked={v.ackPrice === "on"} />
          <span>{confirmed
            ? "I have read the pricing basis, inclusions, exclusions, payment schedule and cancellation terms for this package."
            : "I understand some package details are still being confirmed, and that the team will confirm them and my total amount before I pay."}{e.ackPrice && <span className="block text-xs text-red-700">{e.ackPrice}</span>}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="consent" className="mt-1 accent-pine-700" required defaultChecked={v.consent === "on"} />
          <span>I agree to be contacted about this request and for the details provided to be stored for that purpose.{e.consent && <span className="block text-xs text-red-700">{e.consent}</span>}</span>
        </label>
      </div>
      <button className="btn-primary" disabled={pending}>{pending ? "Submitting…" : "Submit Booking Request"}</button>
    </form>
  );
}
