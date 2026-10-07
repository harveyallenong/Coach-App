import { afterAll, beforeEach } from "vitest";

import { db } from "@/server/db";

let tables: string[] | null = null;

beforeEach(async () => {
  tables ??= (
    await db.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
  ).map((t) => `"public"."${t.tablename}"`);
  await db.$executeRawUnsafe(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await db.$disconnect();
});
