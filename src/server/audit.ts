import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { DbClient } from "./db";

export type AuditEntry = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  requestId?: string;
};

/** Pass the transaction client so the entry commits atomically with the change. */
export async function audit(tx: DbClient, entry: AuditEntry) {
  await tx.auditLog.create({ data: entry });
}
