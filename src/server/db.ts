import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { pgConnectionOptions } from "./database-url";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      ...pgConnectionOptions(env.DATABASE_URL, env.DATABASE_CA_CERT),
      // Small per-instance pool: on Vercel each function instance has its own pool,
      // and Supabase's pooler multiplexes them.
      max: env.DATABASE_POOL_MAX,
    }),
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** Either the root client or an interactive-transaction client. */
export type DbClient = PrismaClient | Prisma.TransactionClient;
