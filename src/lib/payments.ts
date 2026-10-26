import { Prisma, type BookingStatus } from "@prisma/client";

type PaymentLike = { amount: Prisma.Decimal; voided: boolean };

export type PaymentSummary = {
  total: Prisma.Decimal | null; // agreed total, null until staff set it
  paid: Prisma.Decimal;
  balance: Prisma.Decimal | null; // never negative
  overpaid: Prisma.Decimal | null;
  percentPaid: number | null; // 0–100, one decimal place
};

export function summarisePayments(agreedTotal: Prisma.Decimal | null, payments: PaymentLike[]): PaymentSummary {
  const paid = payments.filter((p) => !p.voided).reduce((s, p) => s.add(p.amount), new Prisma.Decimal(0));
  if (!agreedTotal || agreedTotal.lte(0)) return { total: agreedTotal, paid, balance: null, overpaid: null, percentPaid: null };
  const diff = agreedTotal.sub(paid);
  const pct = paid.div(agreedTotal).mul(100).toDecimalPlaces(1, Prisma.Decimal.ROUND_DOWN);
  return {
    total: agreedTotal,
    paid,
    balance: diff.gt(0) ? diff : new Prisma.Decimal(0),
    overpaid: diff.lt(0) ? diff.neg() : null,
    percentPaid: Math.min(100, pct.toNumber()),
  };
}

/** Bookings that staff have approved for payment and that still owe money. */
export const PAYABLE_STATUSES: BookingStatus[] = ["AWAITING_DEPOSIT", "CONFIRMED"];

/** Paystack's minimum NGN charge is ₦100; the company can set a higher minimum. */
export const GATEWAY_MIN_NGN = new Prisma.Decimal(100);
