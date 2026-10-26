import Link from "next/link";
import { Logo } from "./Logo";
import type { BusinessSettings } from "@/lib/settings";

export function SiteFooter({ settings: s }: { settings: BusinessSettings }) {
  const address = [s.addressLine, s.city, s.country].filter(Boolean).join(", ");
  return (
    <footer className="mt-24 bg-pine-950 text-ivory/80">
      <div className="pattern-stars">
        <div className="container-page grid gap-10 py-14 md:grid-cols-3">
          <div>
            <Logo name={s.displayName} logoUrl={s.logoUrl} light />
            <p className="mt-4 text-sm leading-relaxed">{s.legalName}</p>
            {s.registrationNumber && <p className="mt-1 text-xs text-ivory/60">{s.registrationNumber}</p>}
            {s.licenceDetails && <p className="mt-1 text-xs text-ivory/60">{s.licenceDetails}</p>}
          </div>
          <div className="text-sm">
            <p className="eyebrow text-gold-300">Explore</p>
            <ul className="mt-3 space-y-2">
              <li><Link href="/packages" className="hover:text-gold-300">Hajj Packages</Link></li>
              <li><Link href="/who-we-serve" className="hover:text-gold-300">Individuals, Families &amp; Groups</Link></li>
              <li><Link href="/pay" className="hover:text-gold-300">Make a Payment</Link></li>
              <li><Link href="/booking-status" className="hover:text-gold-300">Track an Enquiry or Booking</Link></li>
              <li><Link href="/important-information" className="hover:text-gold-300">Important Booking Information</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="eyebrow text-gold-300">Contact</p>
            <ul className="mt-3 space-y-2">
              {s.phone && <li>Tel: {s.phone}</li>}
              {s.whatsapp && <li>WhatsApp: {s.whatsapp}</li>}
              {s.email && <li>{s.email}</li>}
              {address && <li>{address}</li>}
              {s.officeHours && <li>{s.officeHours}</li>}
              {!s.phone && !s.email && !address && (
                <li>
                  Official contact details will be published shortly. Please use our{" "}
                  <Link href="/enquire" className="underline hover:text-gold-300">enquiry form</Link>.
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-ivory/10">
          <div className="container-page flex flex-col gap-2 py-5 text-xs text-ivory/50 sm:flex-row sm:justify-between">
            <span>© {new Date().getFullYear()} {s.legalName}</span>
            <Link href="/admin" className="hover:text-ivory/80">Staff sign in</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
