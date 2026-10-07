import { describe, expect, it } from "vitest";

import { db } from "@/server/db";
import { createAdmin, createClient, createCoach, linkCoachClient } from "../../../tests/factories";
import { expectAppError } from "../../../tests/support/expect-app-error";
import { assertCanAccessClient } from "./policies";

describe("assertCanAccessClient", () => {
  it("allows the client themselves, an admin, and an ACTIVE coach", async () => {
    const c = await createClient();
    const coach = await createCoach();
    const admin = await createAdmin();
    await linkCoachClient(coach.coach.id, c.client.id, "ACTIVE");
    await expect(assertCanAccessClient(db, c.actor, c.client.id)).resolves.toBeUndefined();
    await expect(assertCanAccessClient(db, admin.actor, c.client.id)).resolves.toBeUndefined();
    await expect(assertCanAccessClient(db, coach.actor, c.client.id)).resolves.toBeUndefined();
  });

  it.each(["INVITED", "ARCHIVED"] as const)("forbids a coach whose link is %s", async (status) => {
    const c = await createClient();
    const coach = await createCoach();
    await linkCoachClient(coach.coach.id, c.client.id, status);
    await expectAppError(assertCanAccessClient(db, coach.actor, c.client.id), "FORBIDDEN");
  });

  it("forbids unrelated coaches and other clients", async () => {
    const c = await createClient();
    const other = await createClient();
    const coach = await createCoach();
    await expectAppError(assertCanAccessClient(db, coach.actor, c.client.id), "FORBIDDEN");
    await expectAppError(assertCanAccessClient(db, other.actor, c.client.id), "FORBIDDEN");
  });
});
