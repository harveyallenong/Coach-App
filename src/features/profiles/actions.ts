"use server";

import { refresh } from "next/cache";

import { action } from "@/server/action";
import { requireCoachRole } from "@/server/authz/policies";
import {
  updateAccount,
  updateCoachProfile,
  updateOwnClientProfile,
} from "@/server/services/profile.service";
import {
  UpdateAccountSchema,
  UpdateClientProfileSchema,
  UpdateCoachProfileSchema,
} from "./schemas";

export const updateCoachProfileAction = action({
  input: UpdateCoachProfileSchema,
  handler: async (input, { actor }) => {
    await updateCoachProfile(actor, requireCoachRole(actor), input);
    refresh();
    return null;
  },
});

export const updateClientProfileAction = action({
  input: UpdateClientProfileSchema,
  handler: async (input, { actor }) => {
    await updateOwnClientProfile(actor, input);
    refresh();
    return null;
  },
});

export const updateAccountAction = action({
  input: UpdateAccountSchema,
  handler: async (input, { actor }) => {
    await updateAccount(actor, input);
    refresh();
    return null;
  },
});
