"use server";

import { revalidatePath } from "next/cache";
import { BookingStatus, InquiryStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "../db";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { sendCustomerEmail } from "../mail";
import { formatMoney, parseAmount } from "../money";
import { parseDateInput } from "../dates";
import { newReceiptNo } from "../refs";
import { summarisePayments } from "../payments";
import { payUrl } from "../paylink";
import { back, str } from "./util";

// ---- Enquiries --------------------------------------------------------------

export async function setInquiryStatus(id: string, fd: FormData) {
  const me = await requireAdmin();
  const status = str(fd, "status") as InquiryStatus;
  if (!Object.values(InquiryStatus).includes(status)) back(`/admin/inquiries/${id}`, "error", "Unknown status.");
  const before = await prisma.inquiry.findUniqueOrThrow({ where: { id } });
  await prisma.inquiry.update({ where: { id }, data: { status } });
  await audit(me.id, "inquiry.status_changed", "Inquiry", id, { from: before.status, to: status });
  revalidatePath(`/admin/inquiries/${id}`);
  back(`/admin/inquiries/${id}`, "ok", "Status updated.");
}

export async function addInquiryNote(id: string, fd: FormData) {
  const me = await requireAdmin();
  const body = str(fd, "body");
  if (!body) back(`/admin/inquiries/${id}`, "error", "Note is empty.");
  await prisma.inquiryNote.create({ data: { inquiryId: id, body, authorId: me.id } });
  back(`/admin/inquiries/${id}`, "ok", "Note added.");
}

// ---- Messages to customers ---------------------------------------------------

export async function messageCustomer(customerId: string, returnTo: string, context: string, fd: FormData) {
  const me = await requireAdmin();
  const subject = str(fd, "subject");
  const body = str(fd, "body");
  if (!subject || !body) back(returnTo, "error", "Subject and message are required.");
  const c = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  await sendCustomerEmail({ to: c.email, customerId, subject, body, context });
  await audit(me.id, "customer.messaged", "Customer", customerId, { subject, context });
  back(returnTo, "ok", "Message recorded in Communications.");
}

// ---- Bookings ----------------------------------------------------------------

const STATUS_MESSAGE: Partial<Record<BookingStatus, string>> = {
  UNDER_REVIEW: "Your booking request is now being reviewed by our team.",
  AWAITING_DEPOSIT: "Good news — your booking has been approved and is now open for payment. You can pay in full or in instalments online using the link below (card, bank transfer or USSD via Paystack). No account or password is needed. A receipt is issued for every payment.",
  CONFIRMED: "Your booking has been confirmed. Our team will be in touch with the next steps for your journey.",
  WAITLISTED: "Your booking request has been placed on our waiting list. We will contact you if a place becomes available.",
  CANCELLED: "Your booking has been cancelled. Please contact our team if you have any questions.",
};

export async function setBookingStatus(id: string, fd: FormData) {
  const me = await requireAdmin();
  const status = str(fd, "status") as BookingStatus;
  if (!Object.values(BookingStatus).includes(status)) back(`/admin/bookings/${id}`, "error", "Unknown status.");
  const b = await prisma.booking.findUniqueOrThrow({ where: { id }, include: { customer: true, package: true } });
  if (status === "CONFIRMED" && !b.agreedTotal)
    back(`/admin/bookings/${id}`, "error", "Set the agreed total for this booking before confirming it.");
  await prisma.booking.update({ where: { id }, data: { status } });
  await audit(me.id, "booking.status_changed", "Booking", id, { from: b.status, to: status });

  if (fd.get("notify") === "on" && STATUS_MESSAGE[status]) {
    await sendCustomerEmail({
      to: b.customer.email,
      customerId: b.customerId,
      context: `booking:${b.reference}`,
      subject: `Update on your booking ${b.reference}`,
      body: [
        `Assalamu alaikum ${b.customer.fullName},`,
        "",
        `Booking reference: ${b.reference}`,
        `Package: ${b.package.name}`,
        b.agreedTotal ? `Total amount: ${formatMoney(b.agreedTotal, b.currency)}` : null,
        "",
        STATUS_MESSAGE[status]!,
        str(fd, "message") ? `\n${str(fd, "message")}` : null,
        "",
        status === "CANCELLED" ? "Your booking page:" : "Your private booking & payment page:",
        payUrl(b.reference),
      ].filter((l) => l !== null).join("\n"),
    });
  }
  revalidatePath(`/admin/bookings/${id}`);
  back(`/admin/bookings/${id}`, "ok", "Booking status updated.");
}

export async function setAgreedTotal(id: string, fd: FormData) {
  const me = await requireAdmin("ADMIN");
  const amount = parseAmount(str(fd, "agreedTotal"));
  if (!amount) back(`/admin/bookings/${id}`, "error", "Enter a valid amount.");
  const b = await prisma.booking.findUniqueOrThrow({ where: { id } });
  await prisma.booking.update({ where: { id }, data: { agreedTotal: amount } });
  await audit(me.id, "booking.agreed_total_set", "Booking", id, { from: b.agreedTotal?.toString() ?? null, to: amount });
  back(`/admin/bookings/${id}`, "ok", `Agreed total set to ${formatMoney(amount, b.currency)}.`);
}

export async function addBookingNote(id: string, fd: FormData) {
  const me = await requireAdmin();
  const body = str(fd, "body");
  if (!body) back(`/admin/bookings/${id}`, "error", "Note is empty.");
  await prisma.bookingNote.create({ data: { bookingId: id, body, authorId: me.id } });
  back(`/admin/bookings/${id}`, "ok", "Note added.");
}

export async function recordPayment(id: string, fd: FormData) {
  const me = await requireAdmin("ADMIN");
  const amount = parseAmount(str(fd, "amount"));
  const method = str(fd, "method") as PaymentMethod;
  const receivedAt = parseDateInput(fd.get("receivedAt"));
  if (!amount || Number(amount) <= 0) back(`/admin/bookings/${id}`, "error", "Enter a valid payment amount.");
  if (!Object.values(PaymentMethod).includes(method) || method === "PAYSTACK") back(`/admin/bookings/${id}`, "error", "Choose a payment method.");
  if (!receivedAt) back(`/admin/bookings/${id}`, "error", "Enter the date the payment was received.");
  const b = await prisma.booking.findUniqueOrThrow({ where: { id }, include: { customer: true } });
  const payment = await prisma.payment.create({
    data: {
      receiptNumber: newReceiptNo(),
      bookingId: id,
      amount,
      currency: b.currency,
      method,
      receivedAt,
      externalRef: str(fd, "externalRef") || null,
      note: str(fd, "note") || null,
      recordedById: me.id,
    },
  });
  await audit(me.id, "payment.recorded", "Booking", id, { receipt: payment.receiptNumber, amount, method });

  if (fd.get("notify") === "on") {
    const sum = summarisePayments(b.agreedTotal, await prisma.payment.findMany({ where: { bookingId: id } }));
    await sendCustomerEmail({
      to: b.customer.email,
      customerId: b.customerId,
      context: `booking:${b.reference}`,
      subject: `Payment received — receipt ${payment.receiptNumber}`,
      body: [
        `Assalamu alaikum ${b.customer.fullName},`,
        "",
        `We confirm receipt of ${formatMoney(amount, b.currency)} towards booking ${b.reference}.`,
        `Receipt number: ${payment.receiptNumber}`,
        "",
        sum.total ? `Agreed total: ${formatMoney(sum.total, b.currency)}` : null,
        `Paid to date: ${formatMoney(sum.paid, b.currency)}${sum.percentPaid != null ? ` (${sum.percentPaid}%)` : ""}`,
        sum.balance ? `Balance outstanding: ${formatMoney(sum.balance, b.currency)}` : null,
        "",
        "Please keep this receipt for your records. See your progress, pay your next instalment and download receipts here:",
        payUrl(b.reference),
      ].filter((l) => l !== null).join("\n"),
    });
  }
  back(`/admin/bookings/${id}`, "ok", `Payment recorded. Receipt ${payment.receiptNumber} issued.`);
}

export async function voidPayment(bookingId: string, paymentId: string, fd: FormData) {
  const me = await requireAdmin("OWNER");
  const reason = str(fd, "reason");
  if (reason.length < 3) back(`/admin/bookings/${bookingId}`, "error", "Give a reason for voiding the payment.");
  const p = await prisma.payment.update({ where: { id: paymentId, bookingId }, data: { voided: true, voidReason: reason } });
  await audit(me.id, "payment.voided", "Booking", bookingId, { receipt: p.receiptNumber, reason });
  back(`/admin/bookings/${bookingId}`, "ok", `Receipt ${p.receiptNumber} voided.`);
}
