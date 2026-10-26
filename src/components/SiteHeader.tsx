import Link from "next/link";
import { Logo } from "./Logo";
import type { BusinessSettings } from "@/lib/settings";

const NAV = [
  { href: "/packages", label: "Hajj Packages" },
  { href: "/who-we-serve", label: "Who We Serve" },
  { href: "/about", label: "About" },
  { href: "/booking-status", label: "Track a Request" },
  { href: "/pay", label: "Make a Payment" },
  { href: "/enquire", label: "Enquire" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ settings }: { settings: BusinessSettings }) {
  return (
    <header className="sticky top-0 z-30 border-b border-pine-900/10 bg-ivory/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${settings.displayName} home`}>
          <Logo name={settings.displayName} logoUrl={settings.logoUrl} />
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-ink/80 lg:flex">
          {NAV.filter((n) => n.href !== "/pay").map((n) => (
            <Link key={n.label} href={n.href} className="hover:text-pine-700">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/packages" className="btn-primary">Book Now</Link>
          <Link href="/pay" className="btn-gold">Make a Payment</Link>
        </div>
        <Link href="/pay" className="btn-gold btn-sm ml-auto sm:hidden">Pay</Link>
        <details className="relative lg:hidden">
          <summary className="btn-outline btn-sm cursor-pointer list-none">Menu</summary>
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-pine-900/10 bg-white p-2 shadow-lg">
            {[{ href: "/packages", label: "Book Now" }, ...NAV].map((n) => (
              <Link key={n.label} href={n.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-pine-50">
                {n.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
