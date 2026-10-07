import "server-only";

import {
  UpdateAccountSchema,
  UpdateClientProfileSchema,
  UpdateCoachProfileSchema,
  type UpdateAccountInput,
  type UpdateClientProfileInput,
  type UpdateCoachProfileInput,
} from "@/features/profiles/schemas";
import { audit } from "@/server/audit";
import type { Actor } from "@/server/authz/actor";
import { assertCanManageCoach, requireClientRole } from "@/server/authz/policies";
import { db } from "@/server/db";
import { notFound } from "@/server/errors";

export async function getCoachProfile(actor: Actor, coachId: string) {
  assertCanManageCoach(actor, coachId);
  const coach = await db.coachProfile.findUnique({ where: { id: coachId } });
  if (!coach) throw notFound("Coach profile");
  return coach;
}

export async function updateCoachProfile(
  actor: Actor,
  coachId: string,
  raw: UpdateCoachProfileInput,
) {
  assertCanManageCoach(actor, coachId);
  const input = UpdateCoachProfileSchema.parse(raw);
  return db.$transaction(async (tx) => {
    const before = await tx.coachProfile.findUnique({ where: { id: coachId } });
    if (!before) throw notFound("Coach profile");
    const after = await tx.coachProfile.update({
      where: { id: coachId },
      data: {
        ...input,
        certifications: input.certifications.map((name) => ({ name })),
      },
    });
    await audit(tx, {
      actorId: actor.userId,
      action: "coach.update_profile",
      entityType: "CoachProfile",
      entityId: coachId,
      before: { displayName: before.displayName, marketplaceVisible: before.marketplaceVisible },
      after: { displayName: after.displayName, marketplaceVisible: after.marketplaceVisible },
    });
    return after;
  });
}

export async function getOwnClientProfile(actor: Actor) {
  const clientId = requireClientRole(actor);
  const client = await db.clientProfile.findUnique({ where: { id: clientId } });
  if (!client) throw notFound("Client profile");
  return client;
}

export async function updateOwnClientProfile(actor: Actor, raw: UpdateClientProfileInput) {
  const clientId = requireClientRole(actor);
  const input = UpdateClientProfileSchema.parse(raw);
  return db.clientProfile.update({ where: { id: clientId }, data: input });
}

export async function getAccount(actor: Actor) {
  return db.user.findUniqueOrThrow({
    where: { id: actor.userId },
    select: { id: true, name: true, email: true, phone: true, timezone: true },
  });
}

export async function updateAccount(actor: Actor, raw: UpdateAccountInput) {
  const input = UpdateAccountSchema.parse(raw);
  return db.user.update({
    where: { id: actor.userId },
    data: input,
    select: { id: true, name: true, phone: true, timezone: true },
  });
}
