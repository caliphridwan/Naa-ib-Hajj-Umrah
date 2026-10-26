import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "./db";
import { getSettings } from "./settings";

function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
}

/**
 * Sends a customer email in the company's name and records it in the
 * Communications log. Without SMTP configured it is logged only.
 */
export async function sendCustomerEmail(opts: {
  to: string;
  subject: string;
  body: string;
  customerId?: string;
  context?: string;
}) {
  const s = await getSettings();
  const signature = [
    "",
    "—",
    s.legalName,
    s.phone ? `Tel: ${s.phone}` : null,
    s.email ? `Email: ${s.email}` : null,
    s.addressLine ? [s.addressLine, s.city, s.country].filter(Boolean).join(", ") : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
  const body = `${opts.body}\n${signature}`;
  const subject = `${s.displayName} — ${opts.subject}`;

  const record = await prisma.communication.create({
    data: { toAddress: opts.to, subject, body, customerId: opts.customerId, context: opts.context, status: "QUEUED" },
  });

  const t = transport();
  if (!t) {
    await prisma.communication.update({ where: { id: record.id }, data: { status: "LOGGED_ONLY" } });
    return;
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || s.email || undefined, to: opts.to, subject, text: body });
    await prisma.communication.update({ where: { id: record.id }, data: { status: "SENT" } });
  } catch (e) {
    await prisma.communication.update({
      where: { id: record.id },
      data: { status: "FAILED", error: e instanceof Error ? e.message : String(e) },
    });
  }
}
