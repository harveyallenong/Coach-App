"use server";

import { refresh } from "next/cache";

import { action } from "@/server/action";
import {
  acceptInvite,
  archiveClientLink,
  createInvite,
} from "@/server/services/coach-client.service";
import { AcceptInviteSchema, ArchiveClientLinkSchema, CreateInviteSchema } from "./schemas";

export const createInviteAction = action({
  input: CreateInviteSchema,
  handler: async (input, { actor }) => {
    const invite = await createInvite(actor, input);
    refresh();
    return { url: invite.url };
  },
});

export const acceptInviteAction = action({
  input: AcceptInviteSchema,
  handler: async ({ token }, { actor }) => {
    await acceptInvite(actor, token);
    return null;
  },
});

export const archiveClientLinkAction = action({
  input: ArchiveClientLinkSchema,
  handler: async ({ linkId }, { actor }) => {
    await archiveClientLink(actor, linkId);
    refresh();
    return null;
  },
});
