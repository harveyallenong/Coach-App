import { describe, expect, it } from "vitest";

import { db } from "@/server/db";
import { createCoach, createUser, loadActorForTest } from "../../../tests/factories";
import { expectAppError } from "../../../tests/support/expect-app-error";
import { becomeClient, becomeCoach } from "./onboarding.service";

const input = { displayName: "Ana Cruz", timezone: "Asia/Manila", currency: "PHP" } as const;

describe("becomeCoach", () => {
  it("creates a coach profile with a slug and writes an audit entry", async () => {
    const user = await createUser({ name: null });
    const result = await becomeCoach(await loadActorForTest(user.id), input);

    const coach = await db.coachProfile.findUniqueOrThrow({ where: { id: result.coachId } });
    expect(coach.slug).toBe("ana-cruz");
    expect(coach.currency).toBe("PHP");
    expect(coach.defaultBufferBeforeMin).toBe(5);
    expect(coach.defaultBufferAfterMin).toBe(5);
    expect(coach.slotStepMin).toBe(60);
    expect(coach.cancellationWindowMin).toBe(30);
    expect(coach.lateCancelPolicy).toBe("FORFEIT");
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).name).toBe("Ana Cruz");
    expect(await db.auditLog.count({ where: { action: "coach.create", entityId: coach.id } })).toBe(
      1,
    );
  });

  it("de-duplicates slugs", async () => {
    const a = await createUser();
    const b = await createUser();
    await becomeCoach(await loadActorForTest(a.id), input);
    const second = await becomeCoach(await loadActorForTest(b.id), input);
    expect(second.slug).toBe("ana-cruz-2");
  });

  it("refuses a second coach profile", async () => {
    const { actor } = await createCoach();
    await expectAppError(becomeCoach(actor, input), "CONFLICT");
  });
});

describe("becomeClient", () => {
  it("is idempotent", async () => {
    const user = await createUser();
    const first = await becomeClient(await loadActorForTest(user.id));
    const second = await becomeClient(await loadActorForTest(user.id));
    expect(second.clientId).toBe(first.clientId);
    expect(await db.clientProfile.count({ where: { userId: user.id } })).toBe(1);
  });

  it("lets a coach also become a client", async () => {
    const { actor, user } = await createCoach();
    await becomeClient(actor);
    const refreshed = await loadActorForTest(user.id);
    expect(refreshed.coachId).not.toBeNull();
    expect(refreshed.clientId).not.toBeNull();
  });
});
