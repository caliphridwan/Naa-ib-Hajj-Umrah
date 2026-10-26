import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Staff sign in", robots: { index: false } };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  const s = await getSettings();
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-pine-950 px-4">
      <div className="pattern-stars absolute inset-0 opacity-50" aria-hidden />
      <div className="relative w-full max-w-sm rounded-3xl bg-ivory p-8 shadow-2xl">
        <Logo name={s.displayName} logoUrl={s.logoUrl} />
        <h1 className="mt-6 font-serif text-3xl font-semibold text-pine-900">Staff sign in</h1>
        <p className="mt-1 text-sm text-stone">Administration for {s.legalName}</p>
        <LoginForm />
      </div>
    </div>
  );
}
