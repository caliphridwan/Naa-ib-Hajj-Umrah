import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminRole } from "@prisma/client";
import { prisma } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";

const RANK: Record<AdminRole, number> = { STAFF: 1, ADMIN: 2, OWNER: 3 };

export async function getCurrentAdmin() {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return user;
}

export type CurrentAdmin = NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>;

/** Use in every admin page and server action. Role is re-read from the DB. */
export async function requireAdmin(minRole: AdminRole = "STAFF"): Promise<CurrentAdmin> {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  if (RANK[user.role] < RANK[minRole]) redirect("/admin?error=" + encodeURIComponent("You do not have permission for that action."));
  return user;
}

export function hasRole(user: { role: AdminRole }, minRole: AdminRole) {
  return RANK[user.role] >= RANK[minRole];
}
