// DB-level double-booking prevention (PLAN §1.3, ADR 0003). Phase 2's booking
// service builds on this; these tests pin the constraint itself.
import { describe, expect, it } from "vitest";

import { db } from "@/server/db";
import { appointmentData, createCoach, createService } from "../factories";

const at = (iso: string) => new Date(iso);

async function setup() {
  const { coach, user } = await createCoach();
  const service = await createService(coach.id);
  const base = { coachId: coach.id, serviceId: service.id, createdById: user.id };
  return { coach, user, service, base };
}

function pgCode(err: unknown): string | undefined {
  // Prisma wraps driver errors; the SQLSTATE surfaces in the message/meta.
  const text = JSON.stringify(err, Object.getOwnPropertyNames(err as object));
  return text.match(/23P01|23514/)?.[0];
}

describe("Appointment_no_overlap", () => {
  it("rejects an overlapping appointment for the same coach", async () => {
    const { base } = await setup();
    await db.appointment.create({
      data: appointmentData({ ...base, startAt: at("2026-10-10T01:00:00Z") }),
    });
    const err = await db.appointment
      .create({ data: appointmentData({ ...base, startAt: at("2026-10-10T01:30:00Z") }) })
      .catch((e: unknown) => e);
    expect(pgCode(err)).toBe("23P01");
  });

  it("treats 5+5 min buffers as additive: back-to-back needs a 10-minute gap", async () => {
    const { base } = await setup();
    await db.appointment.create({
      data: appointmentData({ ...base, startAt: at("2026-10-10T01:00:00Z") }),
    });
    // Ends 02:00; next starting 02:05 → buffers overlap.
    const tooClose = await db.appointment
      .create({ data: appointmentData({ ...base, startAt: at("2026-10-10T02:05:00Z") }) })
      .catch((e: unknown) => e);
    expect(pgCode(tooClose)).toBe("23P01");
    // Starting 02:10 → buffers just touch (half-open ranges).
    await expect(
      db.appointment.create({
        data: appointmentData({ ...base, startAt: at("2026-10-10T02:10:00Z") }),
      }),
    ).resolves.toBeDefined();
  });

  it("ignores cancelled appointments", async () => {
    const { base } = await setup();
    await db.appointment.create({
      data: appointmentData({ ...base, startAt: at("2026-10-10T01:00:00Z"), status: "CANCELLED" }),
    });
    await expect(
      db.appointment.create({
        data: appointmentData({ ...base, startAt: at("2026-10-10T01:00:00Z") }),
      }),
    ).resolves.toBeDefined();
  });

  it("does not block other coaches", async () => {
    const a = await setup();
    const b = await setup();
    await db.appointment.create({
      data: appointmentData({ ...a.base, startAt: at("2026-10-10T01:00:00Z") }),
    });
    await expect(
      db.appointment.create({
        data: appointmentData({ ...b.base, startAt: at("2026-10-10T01:00:00Z") }),
      }),
    ).resolves.toBeDefined();
  });

  it("lets exactly one of many concurrent inserts for the same slot win", async () => {
    const { base, coach } = await setup();
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        db.appointment.create({
          data: appointmentData({ ...base, startAt: at("2026-10-10T03:00:00Z") }),
        }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.appointment.count({ where: { coachId: coach.id } })).toBe(1);
  });

  it("rejects an occupied range that doesn't match the buffers", async () => {
    const { base } = await setup();
    const data = appointmentData({ ...base, startAt: at("2026-10-10T01:00:00Z") });
    const err = await db.appointment
      .create({ data: { ...data, occupiedStart: data.startAt } })
      .catch((e: unknown) => e);
    expect(pgCode(err)).toBe("23514");
  });
});
