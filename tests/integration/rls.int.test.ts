// Supabase's Data API can reach any public table without RLS (see the
// *_lock_down_data_api migration). Every table must have RLS enabled.
// For a new model, add `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;` to its migration.
import { describe, expect, it } from "vitest";

import { db } from "@/server/db";

describe("row-level security", () => {
  it("is enabled on every public table", async () => {
    const rows = await db.$queryRaw<{ relname: string }[]>`
      SELECT c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity`;
    expect(rows.map((r) => r.relname)).toEqual([]);
  });
});
