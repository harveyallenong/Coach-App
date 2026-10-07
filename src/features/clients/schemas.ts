import { z } from "zod";

export const CreateInviteSchema = z.object({
  email: z
    .union([z.literal(""), z.email("Enter a valid email.")])
    .nullish()
    .transform((s) => (s ? s.toLowerCase() : null)),
});
export type CreateInviteInput = z.input<typeof CreateInviteSchema>;

export const AcceptInviteSchema = z.object({ token: z.string().min(16).max(128) });

export const ArchiveClientLinkSchema = z.object({ linkId: z.string().min(1) });
