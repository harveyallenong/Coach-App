import { describe, expect, it } from "vitest";

import { db } from "@/server/db";
import {
  createClient,
  createCoach,
  createUser,
  linkCoachClient,
  loadActorForTest,
} from "../../../tests/factories";
import { expectAppError } from "../../../tests/support/expect-app-error";
import {
  acceptInvite,
  archiveClientLink,
  createInvite,
  getInvitePreview,
  listClients,
  listMyCoaches,
} from "./coach-client.service";

describe("invites", () => {
  it("creates an invite link and lets a new user accept it", async () => {
    const { actor: coachActor, coach } = await createCoach();
    const { token, url } = await createInvite(coachActor, { email: "" });
    expect(url).toContain(`/invite/${token}`);

    const user = await createUser();
    const clientActor = await loadActorForTest(user.id);
    const preview = await getInvitePreview(clientActor, token);
    expect(preview.canAccept).toBe(true);

    const result = await acceptInvite(clientActor, token);
    expect(result.coachId).toBe(coach.id);
    const link = await db.coachClient.findUniqueOrThrow({ where: { id: result.linkId } });
    expect(link).toMatchObject({ status: "ACTIVE", clientId: result.clientId, inviteToken: null });
    // Accepting created the client profile on the fly.
    expect((await loadActorForTest(user.id)).clientId).toBe(result.clientId);
    expect(await db.auditLog.count({ where: { action: "client.accept_invite" } })).toBe(1);
  });

  it("only coaches can create invites", async () => {
    const { actor } = await createClient();
    await expectAppError(createInvite(actor, {}), "FORBIDDEN");
  });

  it("enforces the invite email", async () => {
    const { actor: coachActor } = await createCoach();
    const { token } = await createInvite(coachActor, { email: "ana@example.com" });
    const other = await createClient({ user: { email: "ben@example.com" } });
    await expectAppError(acceptInvite(other.actor, token), "CONFLICT");
    const ana = await createClient({ user: { email: "ana@example.com" } });
    await expect(acceptInvite(ana.actor, token)).resolves.toBeDefined();
  });

  it("rejects reuse and self-acceptance", async () => {
    const { actor: coachActor } = await createCoach();
    const { token } = await createInvite(coachActor, {});
    await expectAppError(acceptInvite(coachActor, token), "CONFLICT");
    const first = await createClient();
    await acceptInvite(first.actor, token);
    const second = await createClient();
    await expectAppError(acceptInvite(second.actor, token), "NOT_FOUND"); // token cleared on use
  });

  it("lets exactly one of two concurrent acceptances win", async () => {
    const { actor: coachActor } = await createCoach();
    const { token } = await createInvite(coachActor, {});
    const [a, b] = await Promise.all([createClient(), createClient()]);
    const results = await Promise.allSettled([
      acceptInvite(a.actor, token),
      acceptInvite(b.actor, token),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.coachClient.count({ where: { status: "ACTIVE" } })).toBe(1);
  });

  it("reactivates an archived relationship instead of duplicating it", async () => {
    const { actor: coachActor, coach } = await createCoach();
    const { actor: clientActor, client } = await createClient();
    const old = await linkCoachClient(coach.id, client.id, "ARCHIVED");
    const { token } = await createInvite(coachActor, {});
    const result = await acceptInvite(clientActor, token);
    expect(result.linkId).toBe(old.id);
    expect(await db.coachClient.count({ where: { coachId: coach.id } })).toBe(1);
    expect((await db.coachClient.findUniqueOrThrow({ where: { id: old.id } })).status).toBe(
      "ACTIVE",
    );
  });
});

describe("client lists are scoped to the coach", () => {
  it("never shows another coach's clients", async () => {
    const a = await createCoach();
    const b = await createCoach();
    const c = await createClient();
    await linkCoachClient(a.coach.id, c.client.id);
    expect(await listClients(a.actor)).toHaveLength(1);
    expect(await listClients(b.actor)).toHaveLength(0);
  });

  it("forbids non-coaches from listing", async () => {
    const { actor } = await createClient();
    await expectAppError(listClients(actor), "FORBIDDEN");
  });

  it("lists a client's active coaches only", async () => {
    const a = await createCoach();
    const b = await createCoach();
    const c = await createClient();
    await linkCoachClient(a.coach.id, c.client.id, "ACTIVE");
    await linkCoachClient(b.coach.id, c.client.id, "ARCHIVED");
    const coaches = await listMyCoaches(c.actor);
    expect(coaches.map((x) => x.coach.id)).toEqual([a.coach.id]);
  });
});

describe("archiveClientLink", () => {
  it("archives own client and audits it", async () => {
    const a = await createCoach();
    const c = await createClient();
    const link = await linkCoachClient(a.coach.id, c.client.id);
    await archiveClientLink(a.actor, link.id);
    expect((await db.coachClient.findUniqueOrThrow({ where: { id: link.id } })).status).toBe(
      "ARCHIVED",
    );
    expect(await db.auditLog.count({ where: { action: "client.archive" } })).toBe(1);
  });

  it("forbids archiving another coach's client", async () => {
    const a = await createCoach();
    const b = await createCoach();
    const c = await createClient();
    const link = await linkCoachClient(a.coach.id, c.client.id);
    await expectAppError(archiveClientLink(b.actor, link.id), "FORBIDDEN");
  });
});
