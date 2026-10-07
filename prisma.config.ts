import "dotenv/config";
import { defineConfig } from "prisma/config";

import { resolveMigrationUrl } from "./src/server/database-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    // Migrations need a direct / session-mode connection (DIRECT_URL or the
    // Supabase integration's POSTGRES_URL_NON_POOLING); falls back to DATABASE_URL.
    url: resolveMigrationUrl(process.env) ?? "",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
