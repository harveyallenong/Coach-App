"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";

import type { Result } from "@/lib/result";
import { toErrorResult } from "@/server/action";
import { signIn, signOut } from "@/server/auth/config";
import { logger } from "@/server/logger";
import { enforce, RATE_LIMITS } from "@/server/rate-limit";
import { MagicLinkSchema } from "./schemas";

/** Public: email a magic sign-in link. Rate-limited per email and per IP. */
export async function requestMagicLink(
  raw: z.input<typeof MagicLinkSchema>,
): Promise<Result<null>> {
  const parsed = MagicLinkSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Enter a valid email.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      },
    };
  }
  try {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await enforce(`magic:email:${parsed.data.email}`, RATE_LIMITS.magicLinkPerEmail);
    await enforce(`magic:ip:${ip}`, RATE_LIMITS.magicLinkPerIp);
    // With redirect: false, Auth.js reports most failures (e.g. the mail server
    // rejecting our credentials) by returning its error-page URL, not by throwing.
    const result: unknown = await signIn("nodemailer", {
      email: parsed.data.email,
      redirect: false,
      redirectTo: parsed.data.callbackUrl ?? "/home",
    });
    const errorType = authErrorFromUrl(result);
    if (errorType) return magicLinkError(errorType);
  } catch (err) {
    if (err instanceof AuthError) return magicLinkError(err.type, err);
    return toErrorResult(err);
  }
  redirect("/sign-in/check-email");
}

function authErrorFromUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  return new URL(url, "http://localhost").searchParams.get("error");
}

function magicLinkError(type: string, err?: unknown): Result<null> {
  if (type === "AccessDenied") {
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "This account can't sign in. Contact support if this is a mistake.",
      },
    };
  }
  // Almost always the mail server rejecting us (e.g. a wrong SMTP password).
  logger.error({ err, type }, "auth.magic_link_send_failed");
  return {
    ok: false,
    error: {
      code: "INTERNAL",
      message: "We couldn't send the sign-in email. Please try again in a few minutes.",
    },
  };
}

export async function signInWithGoogle(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "");
  const safe = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/home";
  await signIn("google", { redirectTo: safe });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
