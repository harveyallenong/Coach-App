import "server-only";

import { requirePageActor } from "@/server/auth/session";
import { listUsers } from "@/server/services/admin.service";

export async function getAdminUsers(query?: string) {
  const actor = await requirePageActor();
  const users = await listUsers(actor, { query });
  return {
    currentUserId: actor.userId,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      isAdmin: u.isAdmin,
      isCoach: !!u.coachProfile,
      isClient: !!u.clientProfile,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}
