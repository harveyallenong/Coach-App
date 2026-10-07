import "server-only";

import type { Actor } from "@/server/authz/actor";
import { db } from "@/server/db";

/** Build the Actor for a user id; null if the user is missing or not ACTIVE. */
export async function loadActor(userId: string): Promise<Actor | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      coachProfile: { select: { id: true } },
      clientProfile: { select: { id: true } },
    },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
    isAdmin: user.isAdmin,
    coachId: user.coachProfile?.id ?? null,
    clientId: user.clientProfile?.id ?? null,
  };
}
