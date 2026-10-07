import "server-only";

import type { DbClient } from "@/server/db";
import { forbidden } from "@/server/errors";
import type { Actor } from "./actor";

export function requireCoachRole(actor: Actor): string {
  if (!actor.coachId) throw forbidden("Only coaches can do this.");
  return actor.coachId;
}

export function requireClientRole(actor: Actor): string {
  if (!actor.clientId) throw forbidden("Only clients can do this.");
  return actor.clientId;
}

export function requireAdmin(actor: Actor): void {
  if (!actor.isAdmin) throw forbidden("Admins only.");
}

/** The actor is this coach, or an admin. */
export function assertCanManageCoach(actor: Actor, coachId: string): void {
  if (actor.coachId === coachId || actor.isAdmin) return;
  throw forbidden();
}

/** True when the coach has an ACTIVE relationship with the client. */
export async function hasActiveCoachClientLink(
  tx: DbClient,
  coachId: string,
  clientId: string,
): Promise<boolean> {
  const link = await tx.coachClient.findFirst({
    where: { coachId, clientId, status: "ACTIVE" },
    select: { id: true },
  });
  return link !== null;
}

/**
 * Client data is visible to the client themselves, to coaches with an ACTIVE
 * link, and to admins.
 */
export async function assertCanAccessClient(
  tx: DbClient,
  actor: Actor,
  clientId: string,
): Promise<void> {
  if (actor.isAdmin || actor.clientId === clientId) return;
  if (actor.coachId && (await hasActiveCoachClientLink(tx, actor.coachId, clientId))) return;
  throw forbidden();
}
