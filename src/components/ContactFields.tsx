"use client";

import { useState } from "react";
import { Field } from "./Field";

const TYPES = [
  { v: "INDIVIDUAL", l: "Individual pilgrim" },
  { v: "FAMILY", l: "Family" },
  { v: "GROUP", l: "Group organiser" },
  { v: "INSTITUTION", l: "Institution / organisation" },
];

export function ContactFields({ errors = {}, values = {}, defaultType = "INDIVIDUAL" }: { errors?: Record<string, string>; values?: Record<string, string>; defaultType?: string }) {
  const [type, setType] = useState(TYPES.some((t) => t.v === defaultType) ? defaultType : "INDIVIDUAL");
  const org = type === "GROUP" || type === "INSTITUTION";
  return (
    <>
      <fieldset>
        <legend className="label">I am enquiring as</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {TYPES.map((t) => (
            <label key={t.v} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${type === t.v ? "border-pine-700 bg-pine-50" : "border-pine-900/15 bg-white"}`}>
              <input type="radio" name="type" value={t.v} checked={type === t.v} onChange={() => setType(t.v)} className="accent-pine-700" />
              {t.l}
            </label>
          ))}
        </div>
      </fieldset>
      {org && (
        <Field label="Group or organisation name" name="organisationName" error={errors.organisationName}>
          <input id="organisationName" name="organisationName" defaultValue={values.organisationName} className="input" required maxLength={160} />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={org ? "Contact person's full name" : "Full name"} name="fullName" error={errors.fullName}>
          <input id="fullName" name="fullName" defaultValue={values.fullName} className="input" required autoComplete="name" maxLength={120} />
        </Field>
        <Field label="City" name="city" error={errors.city}>
          <input id="city" name="city" defaultValue={values.city} className="input" autoComplete="address-level2" maxLength={80} />
        </Field>
        <Field label="Email address" name="email" error={errors.email}>
          <input id="email" name="email" defaultValue={values.email} type="email" className="input" required autoComplete="email" maxLength={160} />
        </Field>
        <Field label="Phone number" name="phone" error={errors.phone}>
          <input id="phone" name="phone" defaultValue={values.phone} type="tel" className="input" required autoComplete="tel" maxLength={30} />
        </Field>
      </div>
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
    </>
  );
}
