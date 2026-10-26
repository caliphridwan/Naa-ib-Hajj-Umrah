"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { AdminRole } from "@prisma/client";
import { prisma } from "../db";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { parseAmount } from "../money";
import { back, optStr, str } from "./util";

export async function updateSettings(fd: FormData) {
  const me = await requireAdmin("OWNER");
  const displayName = str(fd, "displayName");
  const legalName = str(fd, "legalName");
  if (!displayName || !legalName) back("/admin/settings", "error", "Display name and legal name are required.");
  const logoUrl = optStr(fd, "logoUrl");
  if (logoUrl && !/^(https:\/\/|\/files\/)/.test(logoUrl)) back("/admin/settings", "error", "Logo URL must start with https:// or /files/.");
  const minRaw = str(fd, "minOnlineInstalment");
  const minOnlineInstalment = minRaw ? parseAmount(minRaw) : null;
  if (minRaw && !minOnlineInstalment) back("/admin/settings", "error", "Minimum online instalment must be an amount in Naira.");
  const data = {
    minOnlineInstalment,
    displayName,
    legalName,
    identityConfirmed: fd.get("identityConfirmed") === "on",
    tagline: optStr(fd, "tagline"),
    logoUrl,
    registrationNumber: optStr(fd, "registrationNumber"),
    licenceDetails: optStr(fd, "licenceDetails"),
    addressLine: optStr(fd, "addressLine"),
    city: optStr(fd, "city"),
    country: optStr(fd, "country"),
    phone: optStr(fd, "phone"),
    whatsapp: optStr(fd, "whatsapp"),
    email: optStr(fd, "email"),
    officeHours: optStr(fd, "officeHours"),
    receiptFooter: optStr(fd, "receiptFooter"),
  };
  await prisma.businessSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
  await audit(me.id, "settings.updated", "BusinessSettings", "default", data);
  revalidatePath("/", "layout");
  back("/admin/settings", "ok", "Business settings saved.");
}

export async function createUser(fd: FormData) {
  const me = await requireAdmin("OWNER");
  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name");
  const role = str(fd, "role") as AdminRole;
  const password = str(fd, "password");
  if (!email.includes("@") || !name) back("/admin/users", "error", "Name and a valid email are required.");
  if (!Object.values(AdminRole).includes(role)) back("/admin/users", "error", "Choose a role.");
  if (password.length < 10) back("/admin/users", "error", "Temporary password must be at least 10 characters.");
  if (await prisma.adminUser.findUnique({ where: { email } })) back("/admin/users", "error", "An account with that email already exists.");
  const u = await prisma.adminUser.create({ data: { email, name, role, passwordHash: await bcrypt.hash(password, 12) } });
  await audit(me.id, "user.created", "AdminUser", u.id, { email, role });
  back("/admin/users", "ok", `Account created for ${name}. Share the temporary password securely.`);
}

export async function updateUser(userId: string, fd: FormData) {
  const me = await requireAdmin("OWNER");
  const role = str(fd, "role") as AdminRole;
  const active = fd.get("active") === "on";
  if (userId === me.id && (role !== "OWNER" || !active)) back("/admin/users", "error", "You cannot demote or deactivate your own account.");
  if (!Object.values(AdminRole).includes(role)) back("/admin/users", "error", "Choose a role.");
  const password = str(fd, "password");
  if (password && password.length < 10) back("/admin/users", "error", "New password must be at least 10 characters.");
  await prisma.adminUser.update({
    where: { id: userId },
    data: { role, active, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) },
  });
  await audit(me.id, "user.updated", "AdminUser", userId, { role, active, passwordReset: !!password });
  back("/admin/users", "ok", "Account updated.");
}
