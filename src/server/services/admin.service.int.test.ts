import { describe, expect, it } from "vitest";

import { loadActor } from "@/server/auth/load-actor";
import { db } from "@/server/db";
import { createAdmin, createClient, createCoach } from "../../../tests/factories";
import { expectAppError } from "../../../tests/support/expect-app-error";
import { listUsers, setUserStatus } from "./admin.service";

describe("admin", () => {
  it("is admin-only", async () => {
    const { actor } = await createCoach();
    await expectAppError(listUsers(actor), "FORBIDDEN");
    const target = await createClient();
    await expectAppError(setUserStatus(actor, target.user.id, "SUSPENDED"), "FORBIDDEN");
  });

  it("searches users", async () => {
    const { actor } = await createAdmin();
    await createClient({ user: { email: "maria@example.com", name: "Maria" } });
    await createClient({ user: { email: "jose@example.com", name: "Jose" } });
    const users = await listUsers(actor, { query: "MARIA" });
    expect(users.map((u) => u.email)).toEqual(["maria@example.com"]);
  });

  it("suspending revokes sessions, blocks the actor and is audited", async () => {
    const { actor } = await createAdmin();
    const target = await createClient();
    await db.session.create({
      data: {
        sessionToken: "tok",
        userId: target.user.id,
        expires: new Date(Date.now() + 86_400_000),
      },
    });
    await setUserStatus(actor, target.user.id, "SUSPENDED");
    expect(await db.session.count({ where: { userId: target.user.id } })).toBe(0);
    expect(await loadActor(target.user.id)).toBeNull();
    expect(await db.auditLog.count({ where: { action: "admin.set_user_status" } })).toBe(1);

    await setUserStatus(actor, target.user.id, "ACTIVE");
    expect(await loadActor(target.user.id)).not.toBeNull();
  });

  it("can't change own status", async () => {
    const { actor, user } = await createAdmin();
    await expectAppError(setUserStatus(actor, user.id, "SUSPENDED"), "CONFLICT");
  });
});
