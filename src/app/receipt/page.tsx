import Link from "next/link";
import { notFound } from "next/navigation";
import { loadReceipt, ReceiptDocument } from "@/components/ReceiptDocument";
import { PrintButton } from "@/components/PrintButton";
import { payPath, validPayToken } from "@/lib/paylink";

export const metadata = { title: "Receipt", robots: { index: false } };

// Customer copy of a receipt: requires the booking's private link token.
export default async function CustomerReceipt({ searchParams }: { searchParams: Promise<{ ref?: string; t?: string; no?: string }> }) {
  const sp = await searchParams;
  const ref = sp.ref?.trim().toUpperCase();
  const no = sp.no?.trim().toUpperCase();
  if (!ref || !no || !validPayToken(ref, sp.t)) notFound();
  const p = await loadReceipt({ receiptNumber: no, bookingRef: ref });
  if (!p) notFound();
  return (
    <div className="min-h-screen bg-ivory px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="no-print mb-4 flex items-center justify-between gap-3">
          <Link href={payPath(ref)} className="text-sm text-stone hover:text-pine-700">← Back to my booking</Link>
          <PrintButton />
        </div>
        <ReceiptDocument p={p} />
      </div>
    </div>
  );
}
