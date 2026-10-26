"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "../session";
import { audit } from "../audit";
import { rateLimit } from "../ratelimit";
import { requireAdmin } from "../auth";
import { back, str } from "./util";

type LoginState = { error: string; email: string } | undefined;

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = str(fd, "email").toLowerCase();
  if (!(await rateLimit("login", 10, 15 * 60_000))) return { error: "Too many attempts. Please wait 15 minutes.", email };
  const password = str(fd, "password");
  const user = await prisma.adminUser.findUnique({ where: { email } });
  // Always run a hash comparison to keep timing uniform.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  if (!user || !ok || !user.active) return { error: "Incorrect email or password.", email };

  const token = await signSession({ sub: user.id, role: user.role });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(user.id, "auth.login", "AdminUser", user.id);
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function changeOwnPassword(fd: FormData) {
  const me = await requireAdmin();
  const current = str(fd, "current");
  const next = str(fd, "next");
  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await bcrypt.compare(current, user.passwordHash))) back("/admin/account", "error", "Current password is incorrect.");
  if (next.length < 10) back("/admin/account", "error", "New password must be at least 10 characters.");
  if (next !== str(fd, "confirm")) back("/admin/account", "error", "New passwords do not match.");
  await prisma.adminUser.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  await audit(me.id, "auth.password_changed", "AdminUser", me.id);
  back("/admin/account", "ok", "Password updated.");
}
