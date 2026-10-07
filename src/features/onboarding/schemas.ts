import { z } from "zod";

import { CURRENCY_CODES, isValidTimeZone } from "@/lib/locale";

export const timeZoneSchema = z.string().refine(isValidTimeZone, "Choose a valid time zone.");

export const BecomeCoachSchema = z.object({
  displayName: z.string().trim().min(2, "At least 2 characters.").max(80),
  timezone: timeZoneSchema,
  currency: z.enum(CURRENCY_CODES),
});
export type BecomeCoachInput = z.infer<typeof BecomeCoachSchema>;

export const BecomeClientSchema = z.object({});
