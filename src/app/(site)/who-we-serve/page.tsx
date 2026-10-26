import Link from "next/link";

export const metadata = { title: "Who We Serve" };

const SEGMENTS = [
  { type: "INDIVIDUAL", title: "Individual pilgrims", body: "Personal guidance from enquiry to departure, with clear information about the package you choose." },
  { type: "FAMILY", title: "Families", body: "Tell us who is travelling — including elderly relatives or anyone with particular needs — and we will advise on the options available." },
  { type: "GROUP", title: "Group organisers", body: "Mosque communities, associations and friends travelling together can make a single enquiry for the whole group." },
  { type: "INSTITUTION", title: "Institutions", body: "Organisations arranging Hajj for staff or members can contact us to discuss their requirements." },
];

export default function WhoWeServePage() {
  return (
    <section className="container-page py-16">
      <p className="eyebrow">Who we serve</p>
      <h1 className="mt-3 max-w-2xl font-serif text-5xl font-semibold text-pine-900">Every pilgrim, every party</h1>
      <p className="mt-4 max-w-2xl text-ink/70">
        Our team will confirm which services we can provide for your circumstances when you enquire.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {SEGMENTS.map((s) => (
          <div key={s.type} className="card flex flex-col p-7">
            <h2 className="font-serif text-2xl font-semibold text-pine-900">{s.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/75">{s.body}</p>
            <Link href={`/enquire?type=${s.type}`} className="btn-outline mt-5 self-start">Enquire</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
