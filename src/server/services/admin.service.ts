import "server-only";

import { audit } from "@/server/audit";
import type { Actor } from "@/server/authz/actor";
import { requireAdmin } from "@/server/authz/policies";
import { db } from "@/server/db";
import { conflict, notFound } from "@/server/errors";

export async function listUsers(actor: Actor, opts: { query?: string; take?: number } = {}) {
  requireAdmin(actor);
  const q = opts.query?.trim();
  return db.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(opts.take ?? 50, 200),
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      isAdmin: true,
      createdAt: true,
      coachProfile: { select: { id: true, slug: true } },
      clientProfile: { select: { id: true } },
    },
  });
}

export async function setUserStatus(actor: Actor, userId: string, status: "ACTIVE" | "SUSPENDED") {
  requireAdmin(actor);
  if (userId === actor.userId) throw conflict("You can't change your own status.");
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { status: true } });
    if (!user) throw notFound("User");
    await tx.user.update({ where: { id: userId }, data: { status } });
    // Revoke sessions so a suspension takes effect immediately.
    if (status === "SUSPENDED") await tx.session.deleteMany({ where: { userId } });
    await audit(tx, {
      actorId: actor.userId,
      action: "admin.set_user_status",
      entityType: "User",
      entityId: userId,
      before: { status: user.status },
      after: { status },
    });
  });
}
