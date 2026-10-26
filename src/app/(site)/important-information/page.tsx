export const metadata = { title: "Important Booking Information" };

export default function InfoPage() {
  return (
    <section className="container-page max-w-3xl py-16">
      <p className="eyebrow">Before you book</p>
      <h1 className="mt-3 font-serif text-5xl font-semibold text-pine-900">Important booking information</h1>
      <div className="mt-8 space-y-6 leading-relaxed text-ink/80">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-pine-900">Prices</h2>
          <p className="mt-2">
            Prices are displayed in Nigerian Naira (NGN). Each package states its pricing basis once confirmed. Unless a
            package expressly says so, do not assume that the displayed price includes every tax, optional service,
            visa-related fee or other travel expense. Ask us if anything is unclear.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-2xl font-semibold text-pine-900">Package details</h2>
          <p className="mt-2">
            We only publish package details that our team has verified. Where you see &ldquo;Enquire for Full
            Details&rdquo; or &ldquo;Registration Details Coming Soon&rdquo;, the remaining details are still being
            confirmed.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-2xl font-semibold text-pine-900">Your place</h2>
          <p className="mt-2">
            Submitting an enquiry or booking request does not reserve a Hajj place. A booking is only confirmed when our
            team confirms it to you in writing. Please make payments only on instructions received directly from us, and
            keep the official receipt we issue for every payment.
          </p>
        </div>
      </div>
    </section>
  );
}
