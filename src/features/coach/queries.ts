import "server-only";

import { requirePageActor } from "@/server/auth/session";
import { requireCoachRole } from "@/server/authz/policies";
import { db } from "@/server/db";

export async function getCoachDashboard() {
  const actor = await requirePageActor();
  const coachId = requireCoachRole(actor);
  const [coach, counts] = await Promise.all([
    db.coachProfile.findUniqueOrThrow({
      where: { id: coachId },
      select: { displayName: true, slug: true, bio: true, headline: true, city: true },
    }),
    db.coachClient.groupBy({
      by: ["status"],
      where: { coachId },
      _count: { _all: true },
    }),
  ]);
  const count = (status: string) => counts.find((c) => c.status === status)?._count._all ?? 0;
  return {
    coach,
    activeClients: count("ACTIVE"),
    pendingInvites: count("INVITED"),
    profileComplete: Boolean(coach.bio && coach.headline && coach.city),
  };
}
