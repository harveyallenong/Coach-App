import "server-only";

import type { BecomeCoachInput } from "@/features/onboarding/schemas";
import { audit } from "@/server/audit";
import type { Actor } from "@/server/authz/actor";
import { db } from "@/server/db";
import { slugify, uniqueSlug } from "@/server/domain/slug";
import { conflict } from "@/server/errors";

export async function becomeCoach(actor: Actor, input: BecomeCoachInput) {
  if (actor.coachId) throw conflict("You already have a coach profile.");

  return db.$transaction(async (tx) => {
    const base = slugify(input.displayName);
    const existing = await tx.coachProfile.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const slug = uniqueSlug(base, new Set(existing.map((r) => r.slug)));

    const coach = await tx.coachProfile.create({
      data: {
        userId: actor.userId,
        slug,
        displayName: input.displayName,
        timezone: input.timezone,
        currency: input.currency,
      },
    });
    await tx.user.update({
      where: { id: actor.userId },
      data: { timezone: input.timezone, name: actor.name ?? input.displayName },
    });
    await audit(tx, {
      actorId: actor.userId,
      action: "coach.create",
      entityType: "CoachProfile",
      entityId: coach.id,
      after: { slug, displayName: coach.displayName },
    });
    return { coachId: coach.id, slug };
  });
}

/** Idempotent: returns the existing client profile if there is one. */
export async function becomeClient(actor: Actor) {
  if (actor.clientId) return { clientId: actor.clientId };
  return db.$transaction(async (tx) => {
    const client = await tx.clientProfile.upsert({
      where: { userId: actor.userId },
      update: {},
      create: { userId: actor.userId },
    });
    await audit(tx, {
      actorId: actor.userId,
      action: "client.create",
      entityType: "ClientProfile",
      entityId: client.id,
    });
    return { clientId: client.id };
  });
}
