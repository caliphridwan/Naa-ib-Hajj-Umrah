const STEPS = [
  { title: "Book your package", body: "Choose a package and click Book Now. No payment and no account needed yet." },
  { title: "We confirm your place", body: "Our team reviews your booking and confirms the details and your total amount." },
  { title: "Pay in instalments", body: "Pay online with Paystack — card, transfer or USSD — as often as you like." },
  { title: "Track & download receipts", body: "See % paid and balance, and get a receipt for every payment." },
];

/** "How booking & payment works" — optionally highlights the customer's current step (1–4). */
export function PaymentSteps({ current, dark = false, reveal = false }: { current?: number; dark?: boolean; reveal?: boolean }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = current != null && n < current;
        const active = current === n;
        return (
          <li
            key={s.title}
            data-reveal={reveal || undefined}
            style={{ "--d": `${i * 110}ms` } as React.CSSProperties}
            className={`lift rounded-2xl border p-4 ${
              active ? "border-pine-700 bg-pine-50" : dark ? "border-ivory/15 bg-ivory/5" : "border-pine-900/10 bg-white"
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                done ? "bg-pine-700 text-ivory" : active ? "bg-gold-500 text-pine-950" : dark ? "bg-ivory/10 text-ivory" : "bg-sand text-pine-900"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <p className={`mt-2 font-medium ${dark && !active ? "text-ivory" : "text-pine-900"}`}>{s.title}</p>
            <p className={`mt-1 text-xs leading-relaxed ${dark && !active ? "text-ivory/70" : "text-ink/70"}`}>{s.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
