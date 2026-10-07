"use server";

import { refresh } from "next/cache";

import { action } from "@/server/action";
import { setUserStatus } from "@/server/services/admin.service";
import { SetUserStatusSchema } from "./schemas";

export const setUserStatusAction = action({
  input: SetUserStatusSchema,
  handler: async ({ userId, status }, { actor }) => {
    await setUserStatus(actor, userId, status);
    refresh();
    return null;
  },
});
