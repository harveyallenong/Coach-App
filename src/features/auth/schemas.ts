import { z } from "zod";

export const MagicLinkSchema = z.object({
  email: z.email("Enter a valid email.").transform((s) => s.toLowerCase()),
  callbackUrl: z
    .string()
    .optional()
    // Only same-site relative paths, to avoid open redirects.
    .refine((u) => !u || (u.startsWith("/") && !u.startsWith("//")), "Invalid redirect."),
});
