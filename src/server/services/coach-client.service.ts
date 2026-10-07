import "server-only";
import { randomBytes } from "node:crypto";

import type { CreateInviteInput } from "@/features/clients/schemas";
import { CreateInviteSchema } from "@/features/clients/schemas";
import type { CoachClientStatus } from "@/generated/prisma/client";
import { audit } from "@/server/audit";
import type { Actor } from "@/server/authz/actor";
import { requireCoachRole } from "@/server/authz/policies";
import { db } from "@/server/db";
import { evaluateInviteAcceptance } from "@/server/domain/invites";
import { env } from "@/server/env";
import { conflict, forbidden, notFound } from "@/server/errors";

const INVITE_ERRORS = {
  ALREADY_USED: "This invite link has already been used or was revoked.",
  EMAIL_MISMATCH: "This invite was sent to a different email address.",
  SELF_INVITE: "You can't accept your own invite.",
} as const;

export function inviteUrl(token: string) {
  return `${env.APP_URL}/invite/${token}`;
}

export async function createInvite(actor: Actor, raw: CreateInviteInput) {
  const coachId = requireCoachRole(actor);
  const { email } = CreateInviteSchema.parse(raw);
  const token = randomBytes(24).toString("base64url");
  return db.$transaction(async (tx) => {
    const link = await tx.coachClient.create({
      data: { coachId, inviteEmail: email, inviteToken: token, status: "INVITED" },
    });
    await audit(tx, {
      actorId: actor.userId,
      action: "client.invite",
      entityType: "CoachClient",
      entityId: link.id,
      after: { hasEmail: email !== null },
    });
    return { linkId: link.id, token, url: inviteUrl(token) };
  });
}

/** Coach's clients and pending invites. Always scoped to the actor's coach profile. */
export async function listClients(actor: Actor, status?: CoachClientStatus) {
  const coachId = requireCoachRole(actor);
  return db.coachClient.findMany({
    where: { coachId, ...(status ? { status } : { status: { not: "ARCHIVED" } }) },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      status: true,
      inviteEmail: true,
      inviteToken: true,
      createdAt: true,
      client: {
        select: { id: true, user: { select: { name: true, email: true, phone: true } } },
      },
    },
  });
}

export async function getInvitePreview(actor: Actor, token: string) {
  const link = await db.coachClient.findUnique({
    where: { inviteToken: token },
    select: {
      status: true,
      inviteEmail: true,
      coach: { select: { displayName: true, headline: true, city: true, userId: true } },
    },
  });
  if (!link) throw notFound("Invite");
  const decision = evaluateInviteAcceptance(
    { status: link.status, inviteEmail: link.inviteEmail, coachUserId: link.coach.userId },
    { userId: actor.userId, email: actor.email },
  );
  return {
    coachName: link.coach.displayName,
    coachHeadline: link.coach.headline,
    coachCity: link.coach.city,
    canAccept: decision.ok,
    problem: decision.ok ? null : INVITE_ERRORS[decision.reason],
  };
}

export async function acceptInvite(actor: Actor, token: string) {
  return db.$transaction(async (tx) => {
    const link = await tx.coachClient.findUnique({
      where: { inviteToken: token },
      include: { coach: { select: { userId: true } } },
    });
    if (!link) throw notFound("Invite");

    const decision = evaluateInviteAcceptance(
      { status: link.status, inviteEmail: link.inviteEmail, coachUserId: link.coach.userId },
      { userId: actor.userId, email: actor.email },
    );
    if (!decision.ok) throw conflict(INVITE_ERRORS[decision.reason]);

    const client = await tx.clientProfile.upsert({
      where: { userId: actor.userId },
      update: {},
      create: { userId: actor.userId },
    });

    // Guarded update: only one concurrent acceptance can flip INVITED → ACTIVE.
    const existing = await tx.coachClient.findUnique({
      where: { coachId_clientId: { coachId: link.coachId, clientId: client.id } },
    });
    let linkId: string;
    if (existing) {
      await tx.coachClient.update({ where: { id: existing.id }, data: { status: "ACTIVE" } });
      const { count } = await tx.coachClient.deleteMany({
        where: { id: link.id, status: "INVITED" },
      });
      if (count === 0) throw conflict(INVITE_ERRORS.ALREADY_USED);
      linkId = existing.id;
    } else {
      const { count } = await tx.coachClient.updateMany({
        where: { id: link.id, status: "INVITED" },
        data: { status: "ACTIVE", clientId: client.id, inviteToken: null },
      });
      if (count === 0) throw conflict(INVITE_ERRORS.ALREADY_USED);
      linkId = link.id;
    }

    await audit(tx, {
      actorId: actor.userId,
      action: "client.accept_invite",
      entityType: "CoachClient",
      entityId: linkId,
    });
    return { coachId: link.coachId, clientId: client.id, linkId };
  });
}

/** Archive an active client or revoke a pending invite. */
export async function archiveClientLink(actor: Actor, linkId: string) {
  const coachId = requireCoachRole(actor);
  return db.$transaction(async (tx) => {
    const link = await tx.coachClient.findUnique({ where: { id: linkId } });
    if (!link) throw notFound("Client");
    if (link.coachId !== coachId) throw forbidden();
    await tx.coachClient.update({
      where: { id: linkId },
      data: { status: "ARCHIVED", inviteToken: null },
    });
    await audit(tx, {
      actorId: actor.userId,
      action: link.status === "INVITED" ? "client.revoke_invite" : "client.archive",
      entityType: "CoachClient",
      entityId: linkId,
      before: { status: link.status },
      after: { status: "ARCHIVED" },
    });
  });
}

/** Coaches the signed-in client is linked to. */
export async function listMyCoaches(actor: Actor) {
  if (!actor.clientId) return [];
  return db.coachClient.findMany({
    where: { clientId: actor.clientId, status: "ACTIVE" },
    select: {
      id: true,
      coach: { select: { id: true, slug: true, displayName: true, headline: true, city: true } },
    },
  });
}
