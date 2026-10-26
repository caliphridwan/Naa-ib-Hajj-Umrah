import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/Reveal";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.displayName} — Hajj & Travel Services`, template: `%s · ${s.displayName}` },
    description: `${s.legalName}. Hajj packages and travel services operated directly by ${s.displayName}.`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables scroll-reveal styles only when JavaScript runs */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Reveal />
      </body>
    </html>
  );
}
