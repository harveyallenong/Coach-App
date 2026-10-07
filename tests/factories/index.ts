// Typed builders for test data. Tests must use these rather than raw Prisma creates.
import { randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import type { Actor } from "@/server/authz/actor";
import { loadActor } from "@/server/auth/load-actor";
import { db } from "@/server/db";

const uid = () => randomUUID().slice(0, 8);

export async function createUser(overrides: Partial<Prisma.UserCreateInput> = {}) {
  return db.user.create({
    data: { email: `user-${uid()}@test.local`, name: "Test User", ...overrides },
  });
}

export async function createCoach(
  opts: {
    user?: Partial<Prisma.UserCreateInput>;
    profile?: Partial<Prisma.CoachProfileCreateWithoutUserInput>;
  } = {},
) {
  const user = await createUser({ name: "Coach Test", ...opts.user });
  const coach = await db.coachProfile.create({
    data: {
      userId: user.id,
      slug: `coach-${uid()}`,
      displayName: user.name ?? "Coach",
      ...opts.profile,
    },
  });
  return { user, coach, actor: await loadActorForTest(user.id) };
}

export async function createClient(opts: { user?: Partial<Prisma.UserCreateInput> } = {}) {
  const user = await createUser({ name: "Client Test", ...opts.user });
  const client = await db.clientProfile.create({ data: { userId: user.id } });
  return { user, client, actor: await loadActorForTest(user.id) };
}

export async function createAdmin() {
  const user = await createUser({ name: "Admin", isAdmin: true });
  return { user, actor: await loadActorForTest(user.id) };
}

export async function linkCoachClient(
  coachId: string,
  clientId: string,
  status: "INVITED" | "ACTIVE" | "ARCHIVED" = "ACTIVE",
) {
  return db.coachClient.create({ data: { coachId, clientId, status } });
}

export async function createService(
  coachId: string,
  overrides: Partial<Prisma.ServiceUncheckedCreateInput> = {},
) {
  return db.service.create({
    data: {
      coachId,
      name: "60-min PT",
      durationMin: 60,
      priceMinor: 150000,
      currency: "PHP",
      ...overrides,
    },
  });
}

/** Appointment with occupied range derived from buffers (mirrors the DB CHECK). */
export function appointmentData(input: {
  coachId: string;
  serviceId: string;
  createdById: string;
  startAt: Date;
  durationMin?: number;
  bufferBeforeMin?: number;
  bufferAfterMin?: number;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}): Prisma.AppointmentUncheckedCreateInput {
  const before = input.bufferBeforeMin ?? 5;
  const after = input.bufferAfterMin ?? 5;
  const endAt = new Date(input.startAt.getTime() + (input.durationMin ?? 60) * 60_000);
  return {
    coachId: input.coachId,
    serviceId: input.serviceId,
    createdById: input.createdById,
    startAt: input.startAt,
    endAt,
    bufferBeforeMin: before,
    bufferAfterMin: after,
    occupiedStart: new Date(input.startAt.getTime() - before * 60_000),
    occupiedEnd: new Date(endAt.getTime() + after * 60_000),
    capacity: 1,
    locationType: "IN_PERSON",
    status: input.status ?? "SCHEDULED",
  };
}

export async function loadActorForTest(userId: string): Promise<Actor> {
  const actor = await loadActor(userId);
  if (!actor) throw new Error(`No active user ${userId}`);
  return actor;
}
