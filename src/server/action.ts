import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import type { Result } from "@/lib/result";
import type { Actor } from "./authz/actor";
import { requireActor } from "./auth/session";
import { AppError } from "./errors";
import { logger } from "./logger";
import { enforce, RATE_LIMITS, type RateLimitRule } from "./rate-limit";

type Ctx = { actor: Actor };

type ActionOptions<S extends z.ZodType, T> = {
  input: S;
  /** Per-user rate limit. Defaults to the generic mutation limit. */
  rateLimit?: { name: string; rule: RateLimitRule } | false;
  handler: (input: z.infer<S>, ctx: Ctx) => Promise<T>;
};

/**
 * Wraps an authenticated server action: parse input with Zod → require a
 * signed-in actor → rate-limit → run the handler → map errors to Result.
 */
export function action<S extends z.ZodType, T>(opts: ActionOptions<S, T>) {
  return async (raw: z.input<S>): Promise<Result<T>> => {
    try {
      const parsed = opts.input.safeParse(raw);
      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: "VALIDATION",
            message: "Please check the highlighted fields.",
            fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
          },
        };
      }
      const actor = await requireActor();
      const limit = opts.rateLimit ?? { name: "mutation", rule: RATE_LIMITS.mutation };
      if (limit) await enforce(`${limit.name}:user:${actor.userId}`, limit.rule);
      const data = await opts.handler(parsed.data, { actor });
      return { ok: true, data };
    } catch (err) {
      unstable_rethrow(err);
      return toErrorResult(err);
    }
  };
}

export function toErrorResult(err: unknown): Result<never> {
  if (err instanceof AppError) {
    return {
      ok: false,
      error: { code: err.code, message: err.message, fieldErrors: err.fieldErrors },
    };
  }
  logger.error({ err }, "action.unhandled_error");
  return {
    ok: false,
    error: { code: "INTERNAL", message: "Something went wrong. Please try again." },
  };
}
