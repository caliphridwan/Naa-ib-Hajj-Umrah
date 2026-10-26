import { NextResponse, type NextRequest } from "next/server";
import { finalizeOnlinePayment } from "@/lib/online-payments";
import { payPath } from "@/lib/paylink";

// Paystack redirects the customer here after checkout.
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") ?? req.nextUrl.searchParams.get("trxref");
  const origin = process.env.APP_URL || req.nextUrl.origin;
  if (!reference) return NextResponse.redirect(new URL("/pay", origin));
  let result;
  try {
    result = await finalizeOnlinePayment(reference);
  } catch {
    result = { ok: false, message: "We could not confirm your payment with Paystack just now. If you were charged, it will be recorded automatically shortly." };
  }
  const back = new URL("bookingRef" in result && result.bookingRef ? payPath(result.bookingRef) : "/pay", origin);
  back.searchParams.set(result.ok ? "paid" : "payerror", result.message);
  return NextResponse.redirect(back, 303);
}
