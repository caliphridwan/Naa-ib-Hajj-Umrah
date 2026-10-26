import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { loadReceipt, ReceiptDocument } from "@/components/ReceiptDocument";
import { PrintButton } from "@/components/PrintButton";

export default async function Receipt({ params }: { params: Promise<{ id: string; paymentId: string }> }) {
  await requireAdmin();
  const { id, paymentId } = await params;
  const p = await loadReceipt({ paymentId, bookingId: id });
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex justify-end"><PrintButton /></div>
      <ReceiptDocument p={p} />
    </div>
  );
}
