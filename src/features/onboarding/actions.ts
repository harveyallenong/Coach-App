"use server";

import { action } from "@/server/action";
import { becomeClient, becomeCoach } from "@/server/services/onboarding.service";
import { BecomeClientSchema, BecomeCoachSchema } from "./schemas";

export const becomeCoachAction = action({
  input: BecomeCoachSchema,
  handler: (input, { actor }) => becomeCoach(actor, input),
});

export const becomeClientAction = action({
  input: BecomeClientSchema,
  handler: (_input, { actor }) => becomeClient(actor),
});
