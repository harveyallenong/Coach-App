export type InviteLinkState = {
  status: "INVITED" | "ACTIVE" | "ARCHIVED";
  /** If set, only this email may accept. */
  inviteEmail: string | null;
  coachUserId: string;
};

export type InviteAcceptor = { userId: string; email: string };

export type InviteDecision =
  { ok: true } | { ok: false; reason: "ALREADY_USED" | "EMAIL_MISMATCH" | "SELF_INVITE" };

/** Rules for accepting a coach's client invite link. */
export function evaluateInviteAcceptance(
  link: InviteLinkState,
  acceptor: InviteAcceptor,
): InviteDecision {
  if (link.status !== "INVITED") return { ok: false, reason: "ALREADY_USED" };
  if (link.coachUserId === acceptor.userId) return { ok: false, reason: "SELF_INVITE" };
  if (link.inviteEmail && link.inviteEmail.toLowerCase() !== acceptor.email.toLowerCase()) {
    return { ok: false, reason: "EMAIL_MISMATCH" };
  }
  return { ok: true };
}
