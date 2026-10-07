import { describe, expect, it } from "vitest";

import { evaluateInviteAcceptance, type InviteLinkState } from "./invites";

const link = (over: Partial<InviteLinkState> = {}): InviteLinkState => ({
  status: "INVITED",
  inviteEmail: null,
  coachUserId: "coach-user",
  ...over,
});
const acceptor = { userId: "client-user", email: "Client@Example.com" };

describe("evaluateInviteAcceptance", () => {
  it("accepts an open invite", () => {
    expect(evaluateInviteAcceptance(link(), acceptor)).toEqual({ ok: true });
  });

  it("accepts an email-restricted invite case-insensitively", () => {
    expect(evaluateInviteAcceptance(link({ inviteEmail: "client@example.com" }), acceptor)).toEqual(
      { ok: true },
    );
  });

  it("rejects a different email", () => {
    expect(evaluateInviteAcceptance(link({ inviteEmail: "other@example.com" }), acceptor)).toEqual({
      ok: false,
      reason: "EMAIL_MISMATCH",
    });
  });

  it.each(["ACTIVE", "ARCHIVED"] as const)("rejects a %s link as already used", (status) => {
    expect(evaluateInviteAcceptance(link({ status }), acceptor)).toEqual({
      ok: false,
      reason: "ALREADY_USED",
    });
  });

  it("rejects the coach accepting their own invite", () => {
    expect(evaluateInviteAcceptance(link(), { userId: "coach-user", email: "c@x.com" })).toEqual({
      ok: false,
      reason: "SELF_INVITE",
    });
  });

  it("checks used-ness before identity", () => {
    expect(
      evaluateInviteAcceptance(link({ status: "ACTIVE", inviteEmail: "other@x.com" }), acceptor),
    ).toEqual({ ok: false, reason: "ALREADY_USED" });
  });
});
