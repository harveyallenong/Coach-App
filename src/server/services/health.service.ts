import "server-only";

import { db } from "@/server/db";
import { logger } from "@/server/logger";

/** Public liveness check: no authentication, reveals nothing beyond up/down. */
export async function checkHealth(): Promise<{ ok: boolean; database: "up" | "down" }> {
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, database: "up" };
  } catch (err) {
    logger.error({ err }, "health.database_down");
    return { ok: false, database: "down" };
  }
}
