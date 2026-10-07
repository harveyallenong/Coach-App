import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** Either the root client or an interactive-transaction client. */
export type DbClient = PrismaClient | Prisma.TransactionClient;
