import Link from "next/link";
import { requireAdmin, hasRole } from "@/lib/auth";
import { logout } from "@/lib/admin/auth-actions";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/Logo";

export const metadata = { robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [me, s] = await Promise.all([requireAdmin(), getSettings()]);
  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/packages", label: "Packages" },
    { href: "/admin/inquiries", label: "Enquiries" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/communications", label: "Communications" },
    ...(hasRole(me, "ADMIN") ? [{ href: "/admin/site-photos", label: "Site photos" }] : []),
    ...(hasRole(me, "ADMIN") ? [{ href: "/admin/audit", label: "Audit log" }] : []),
    ...(hasRole(me, "OWNER") ? [{ href: "/admin/settings", label: "Business settings" }, { href: "/admin/users", label: "Staff accounts" }] : []),
  ];
  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="no-print border-b border-pine-900/10 bg-pine-950 text-ivory/80 lg:sticky lg:top-0 lg:h-screen lg:border-0">
        <div className="flex items-center justify-between p-5 lg:block">
          <Link href="/admin"><Logo name={s.displayName} logoUrl={s.logoUrl} light /></Link>
          <p className="hidden text-[11px] uppercase tracking-widest text-gold-300 lg:mt-2 lg:block">Administration</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:overflow-visible">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-ivory/10 hover:text-ivory">{n.label}</Link>
          ))}
        </nav>
        <div className="hidden border-t border-ivory/10 p-4 text-xs lg:absolute lg:bottom-0 lg:block lg:w-full">
          <p className="text-ivory">{me.name}</p>
          <p className="text-ivory/50">{me.role.toLowerCase()} · {me.email}</p>
          <div className="mt-3 flex gap-3">
            <Link href="/admin/account" className="hover:text-ivory">Account</Link>
            <Link href="/" className="hover:text-ivory">View site</Link>
            <form action={logout}><button className="hover:text-ivory">Sign out</button></form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
        <div className="mt-10 flex gap-4 text-xs text-stone lg:hidden">
          <Link href="/admin/account">Account</Link>
          <form action={logout}><button>Sign out</button></form>
        </div>
      </main>
    </div>
  );
}
