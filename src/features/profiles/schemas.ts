import { z } from "zod";

import { CURRENCY_CODES } from "@/lib/locale";
import { timeZoneSchema } from "@/features/onboarding/schemas";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s === "" ? null : s))
    .nullable()
    .optional();

export const UpdateCoachProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  headline: optionalText(120),
  bio: optionalText(2000),
  city: optionalText(80),
  serviceArea: optionalText(160),
  timezone: timeZoneSchema,
  currency: z.enum(CURRENCY_CODES),
  acceptsInPerson: z.boolean(),
  acceptsOnline: z.boolean(),
  marketplaceVisible: z.boolean(),
  certifications: z.array(z.string().trim().min(1).max(120)).max(20),
});
export type UpdateCoachProfileInput = z.input<typeof UpdateCoachProfileSchema>;

export const UpdateClientProfileSchema = z.object({
  goals: optionalText(1000),
  healthNotes: optionalText(2000),
  openSlotAlertsOptIn: z.boolean(),
});
export type UpdateClientProfileInput = z.input<typeof UpdateClientProfileSchema>;

export const UpdateAccountSchema = z.object({
  name: z.string().trim().min(1, "Required.").max(80),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^\+?[0-9 ()-]*$/, "Digits, spaces, +, - and () only.")
    .transform((s) => (s === "" ? null : s))
    .nullable()
    .optional(),
  timezone: timeZoneSchema,
});
export type UpdateAccountInput = z.input<typeof UpdateAccountSchema>;

/** Form shape: certifications are edited as one-per-line text. */
export const CoachProfileFormSchema = UpdateCoachProfileSchema.omit({
  certifications: true,
}).extend({
  certificationsText: z.string().max(2500),
});

export function certificationsFromText(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
