import "server-only";

import { AppError } from "./errors";
import { db, type DbClient } from "./db";
import { systemClock, type Clock } from "./clock";

export type RateLimitRule = { limit: number; windowSec: number };

export const RATE_LIMITS = {
  magicLinkPerEmail: { limit: 5, windowSec: 15 * 60 },
  magicLinkPerIp: { limit: 20, windowSec: 15 * 60 },
  mutation: { limit: 60, windowSec: 60 },
} satisfies Record<string, RateLimitRule>;

/**
 * Fixed-window counter in Postgres. A single upsert statement keeps it atomic
 * under concurrent requests. Returns the count after this hit.
 */
export async function hit(
  key: string,
  rule: RateLimitRule,
  opts: { client?: DbClient; clock?: Clock } = {},
): Promise<{ allowed: boolean; count: number }> {
  const client = opts.client ?? db;
  const now = (opts.clock ?? systemClock).now();
  const windowStartCutoff = new Date(now.getTime() - rule.windowSec * 1000);
  const rows = await client.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStart")
    VALUES (${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."windowStart" <= ${windowStartCutoff} THEN 1
                     ELSE "RateLimitBucket"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimitBucket"."windowStart" <= ${windowStartCutoff} THEN ${now}
                     ELSE "RateLimitBucket"."windowStart" END
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);
  return { allowed: count <= rule.limit, count };
}

export async function enforce(key: string, rule: RateLimitRule, opts?: { clock?: Clock }) {
  const { allowed } = await hit(key, rule, opts);
  if (!allowed) throw new AppError("RATE_LIMITED", "Too many attempts. Please wait and try again.");
}
