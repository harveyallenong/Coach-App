import { describe, expect, it } from "vitest";

import { db } from "@/server/db";
import { createAdmin, createClient, createCoach } from "../../../tests/factories";
import { expectAppError } from "../../../tests/support/expect-app-error";
import {
  getCoachProfile,
  updateAccount,
  updateCoachProfile,
  updateOwnClientProfile,
} from "./profile.service";

const profileInput = {
  displayName: "New Name",
  headline: "Strength coach",
  bio: "",
  city: "Taguig",
  serviceArea: "BGC",
  timezone: "Asia/Manila",
  currency: "PHP" as const,
  acceptsInPerson: true,
  acceptsOnline: true,
  marketplaceVisible: true,
  certifications: ["NASM-CPT"],
};

describe("coach profile", () => {
  it("lets a coach update their own profile", async () => {
    const { actor, coach } = await createCoach();
    const updated = await updateCoachProfile(actor, coach.id, profileInput);
    expect(updated.displayName).toBe("New Name");
    expect(updated.bio).toBeNull();
    expect(updated.certifications).toEqual([{ name: "NASM-CPT" }]);
    expect(await db.auditLog.count({ where: { action: "coach.update_profile" } })).toBe(1);
  });

  it("forbids another coach from reading or updating it", async () => {
    const a = await createCoach();
    const b = await createCoach();
    await expectAppError(getCoachProfile(b.actor, a.coach.id), "FORBIDDEN");
    await expectAppError(updateCoachProfile(b.actor, a.coach.id, profileInput), "FORBIDDEN");
  });

  it("forbids a client", async () => {
    const { coach } = await createCoach();
    const { actor } = await createClient();
    await expectAppError(updateCoachProfile(actor, coach.id, profileInput), "FORBIDDEN");
  });

  it("allows an admin", async () => {
    const { coach } = await createCoach();
    const { actor } = await createAdmin();
    await expect(getCoachProfile(actor, coach.id)).resolves.toMatchObject({ id: coach.id });
  });

  it("validates input at the service boundary", async () => {
    const { actor, coach } = await createCoach();
    await expect(
      updateCoachProfile(actor, coach.id, { ...profileInput, timezone: "Bad/Zone" }),
    ).rejects.toThrow();
  });
});

describe("client profile & account", () => {
  it("updates only the actor's own client profile", async () => {
    const { actor, client } = await createClient();
    await updateOwnClientProfile(actor, {
      goals: "Lose 5kg",
      healthNotes: "",
      openSlotAlertsOptIn: true,
    });
    const saved = await db.clientProfile.findUniqueOrThrow({ where: { id: client.id } });
    expect(saved).toMatchObject({
      goals: "Lose 5kg",
      healthNotes: null,
      openSlotAlertsOptIn: true,
    });
  });

  it("forbids a user without a client profile", async () => {
    const { actor } = await createCoach();
    await expectAppError(
      updateOwnClientProfile(actor, { goals: "", healthNotes: "", openSlotAlertsOptIn: false }),
      "FORBIDDEN",
    );
  });

  it("updates account settings", async () => {
    const { actor, user } = await createClient();
    await updateAccount(actor, {
      name: "Ben",
      phone: "+63 917 000 0000",
      timezone: "America/New_York",
    });
    expect(await db.user.findUniqueOrThrow({ where: { id: user.id } })).toMatchObject({
      name: "Ben",
      timezone: "America/New_York",
    });
  });
});
