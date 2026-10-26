import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { audit } from "./audit";
import { sendCustomerEmail } from "./mail";
import { formatMoney } from "./money";
import { newReceiptNo } from "./refs";
import { verifyTransaction } from "./paystack";
import { summarisePayments } from "./payments";
import { payUrl } from "./paylink";

type Result = { ok: boolean; message: string; bookingRef?: string };

/**
 * Verifies a Paystack transaction with Paystack and, if it succeeded for the
 * exact amount we asked for, records the payment and issues a receipt.
 * Safe to call repeatedly (browser callback and webhook can both arrive).
 */
export async function finalizeOnlinePayment(reference: string): Promise<Result> {
  const attempt = await prisma.onlinePaymentAttempt.findUnique({
    where: { reference },
    include: { booking: { include: { customer: true, package: true } } },
  });
  if (!attempt) return { ok: false, message: "We could not find that payment reference." };
  const b = attempt.booking;
  const who = { bookingRef: b.reference };
  if (attempt.status === "SUCCESS") return { ok: true, message: "Payment already recorded.", ...who };

  const tx = await verifyTransaction(reference);

  if (tx.status !== "success") {
    if (tx.status === "failed" || tx.status === "abandoned" || tx.status === "reversed") {
      await prisma.onlinePaymentAttempt.update({ where: { reference }, data: { status: "FAILED", gatewayMessage: tx.gateway_response ?? tx.status } });
    }
    return { ok: false, message: `Your payment was not completed (${tx.gateway_response ?? tx.status}). No money has been recorded.`, ...who };
  }

  if (BigInt(tx.amount) !== attempt.amountKobo || tx.currency !== attempt.currency) {
    await prisma.onlinePaymentAttempt.update({
      where: { reference },
      data: { status: "FAILED", gatewayMessage: `Amount mismatch: expected ${formatMoney((Number(attempt.amountKobo) / 100).toFixed(2), attempt.currency)}, Paystack reported ${formatMoney((tx.amount / 100).toFixed(2), tx.currency)}. Not recorded — needs manual review.` },
    });
    await audit(null, "payment.online_mismatch", "Booking", b.id, { reference, expected: attempt.amountKobo.toString(), received: tx.amount });
    return { ok: false, message: "Your payment needs to be checked by our team. Please contact us with your booking reference.", ...who };
  }

  const amount = new Prisma.Decimal(attempt.amountKobo.toString()).div(100);
  let receiptNumber: string;
  try {
    receiptNumber = await prisma.$transaction(async (db) => {
      const payment = await db.payment.create({
        data: {
          receiptNumber: newReceiptNo(),
          bookingId: b.id,
          amount,
          currency: attempt.currency,
          method: "PAYSTACK",
          paystackReference: reference,
          externalRef: reference,
          receivedAt: tx.paid_at ? new Date(tx.paid_at) : new Date(),
          note: `Online payment via Paystack${tx.channel ? ` (${tx.channel})` : ""}`,
        },
      });
      await db.onlinePaymentAttempt.update({
        where: { reference },
        data: { status: "SUCCESS", paymentId: payment.id, gatewayMessage: tx.gateway_response ?? "Successful" },
      });
      return payment.receiptNumber;
    });
  } catch (e) {
    // Unique paystackReference: another request recorded it first.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: true, message: "Payment already recorded.", ...who };
    throw e;
  }

  await audit(null, "payment.online_received", "Booking", b.id, { reference, receipt: receiptNumber, amount: amount.toString() });

  const all = await prisma.payment.findMany({ where: { bookingId: b.id } });
  const s = summarisePayments(b.agreedTotal, all);
  await sendCustomerEmail({
    to: b.customer.email,
    customerId: b.customerId,
    context: `booking:${b.reference}`,
    subject: `Payment received — receipt ${receiptNumber}`,
    body: [
      `Assalamu alaikum ${b.customer.fullName},`,
      "",
      `We confirm receipt of your online payment of ${formatMoney(amount, attempt.currency)} towards booking ${b.reference} (${b.package.name}).`,
      `Receipt number: ${receiptNumber}`,
      "",
      s.total ? `Agreed total: ${formatMoney(s.total, b.currency)}` : null,
      `Paid to date: ${formatMoney(s.paid, b.currency)}${s.percentPaid != null ? ` (${s.percentPaid}%)` : ""}`,
      s.balance ? `Balance outstanding: ${formatMoney(s.balance, b.currency)}` : null,
      "",
      s.balance && s.balance.gt(0) ? "Pay your next instalment, see your progress and download receipts here:" : "View your payment history and receipts here:",
      payUrl(b.reference),
    ].filter((l) => l !== null).join("\n"),
  });

  return { ok: true, message: `Payment of ${formatMoney(amount, attempt.currency)} received. Receipt ${receiptNumber} has been issued.`, ...who };
}
