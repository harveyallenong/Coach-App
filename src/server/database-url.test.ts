import { describe, expect, it } from "vitest";

import {
  pgConnectionOptions,
  resolveAppUrl,
  resolveDatabaseUrl,
  resolveMigrationUrl,
} from "./database-url";

describe("resolveDatabaseUrl / resolveMigrationUrl", () => {
  it("prefers explicit DATABASE_URL / DIRECT_URL", () => {
    const env = {
      DATABASE_URL: "postgres://a",
      DIRECT_URL: "postgres://d",
      POSTGRES_PRISMA_URL: "postgres://p",
      POSTGRES_URL_NON_POOLING: "postgres://n",
    };
    expect(resolveDatabaseUrl(env)).toBe("postgres://a");
    expect(resolveMigrationUrl(env)).toBe("postgres://d");
  });

  it("falls back to the Supabase integration variables", () => {
    const env = {
      POSTGRES_PRISMA_URL: "postgres://p",
      POSTGRES_URL: "postgres://u",
      POSTGRES_URL_NON_POOLING: "postgres://n",
    };
    expect(resolveDatabaseUrl(env)).toBe("postgres://p");
    expect(resolveMigrationUrl(env)).toBe("postgres://n");
  });

  it("migrations fall back to the runtime URL, and empty strings count as unset", () => {
    expect(resolveMigrationUrl({ DIRECT_URL: "", DATABASE_URL: "postgres://a" })).toBe(
      "postgres://a",
    );
    expect(resolveDatabaseUrl({})).toBeUndefined();
  });
});

describe("pgConnectionOptions", () => {
  it("uses no TLS for local connections", () => {
    expect(pgConnectionOptions("postgresql://postgres:postgres@localhost:5432/coachbook")).toEqual({
      connectionString: "postgresql://postgres:postgres@localhost:5432/coachbook",
      ssl: false,
    });
  });

  it("encrypts Supabase pooler connections and strips Prisma/libpq params", () => {
    const opts = pgConnectionOptions(
      "postgres://postgres.ref:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connect_timeout=15",
    );
    expect(opts.ssl).toEqual({ rejectUnauthorized: false });
    expect(opts.connectionString).toBe(
      "postgres://postgres.ref:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?connect_timeout=15",
    );
  });

  it("encrypts Supabase hosts even without sslmode", () => {
    expect(pgConnectionOptions("postgres://u:p@db.abc.supabase.co:5432/postgres").ssl).toEqual({
      rejectUnauthorized: false,
    });
  });

  it("verifies the certificate when a CA is provided", () => {
    expect(
      pgConnectionOptions("postgres://u:p@x.pooler.supabase.com:6543/postgres", "PEM").ssl,
    ).toEqual({
      rejectUnauthorized: true,
      ca: "PEM",
    });
  });

  it("honours verify-full and disable", () => {
    expect(pgConnectionOptions("postgres://u:p@db.example.com/x?sslmode=verify-full").ssl).toEqual({
      rejectUnauthorized: true,
    });
    expect(pgConnectionOptions("postgres://u:p@db.abc.supabase.co/x?sslmode=disable").ssl).toBe(
      false,
    );
  });
});

describe("resolveAppUrl", () => {
  it("prefers APP_URL without a trailing slash", () => {
    expect(resolveAppUrl({ APP_URL: "https://coachbook.ph/" })).toBe("https://coachbook.ph");
  });

  it("uses Vercel's production domain when APP_URL is unset", () => {
    expect(resolveAppUrl({ VERCEL_PROJECT_PRODUCTION_URL: "coach-app.vercel.app" })).toBe(
      "https://coach-app.vercel.app",
    );
  });

  it("defaults to localhost", () => {
    expect(resolveAppUrl({})).toBe("http://localhost:3000");
  });
});
