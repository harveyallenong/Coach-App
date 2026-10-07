// Pure helpers for connecting to Postgres locally, in CI and on Vercel + Supabase.
// No "server-only" import: the seed script and Prisma config use them too.

type Env = Record<string, string | undefined>;

/**
 * Runtime (pooled) connection string. DATABASE_URL wins; otherwise the
 * variables the Supabase ↔ Vercel integration creates.
 */
export function resolveDatabaseUrl(env: Env): string | undefined {
  return env.DATABASE_URL || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL || undefined;
}

/** Direct/session-mode connection for migrations (advisory locks need a session). */
export function resolveMigrationUrl(env: Env): string | undefined {
  return env.DIRECT_URL || env.POSTGRES_URL_NON_POOLING || resolveDatabaseUrl(env);
}

export type PgSsl = false | { rejectUnauthorized: boolean; ca?: string };

// Query params that are for Prisma/libpq, not node-postgres. node-postgres
// would otherwise reinterpret sslmode=require as verify-full (no Supabase CA →
// "self-signed certificate in certificate chain").
const STRIPPED_PARAMS = [
  "sslmode",
  "sslrootcert",
  "sslaccept",
  "uselibpqcompat",
  "pgbouncer",
  "schema",
];

/**
 * node-postgres options for a connection string.
 * - With a CA certificate: TLS with full verification.
 * - sslmode=verify-full: TLS verified against system CAs.
 * - sslmode=require/prefer, or a Supabase host: TLS without certificate
 *   verification (libpq "require" semantics).
 * - Otherwise (local dev, CI): no TLS.
 */
export function pgConnectionOptions(
  connectionString: string,
  caCert?: string,
): { connectionString: string; ssl: PgSsl } {
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get("sslmode");
  for (const p of STRIPPED_PARAMS) url.searchParams.delete(p);

  const isSupabase = /\.supabase\.(co|com)$/.test(url.hostname);
  let ssl: PgSsl = false;
  if (caCert) ssl = { rejectUnauthorized: true, ca: caCert };
  else if (sslmode === "verify-full" || sslmode === "verify-ca") ssl = { rejectUnauthorized: true };
  else if (sslmode === "disable") ssl = false;
  else if (sslmode === "require" || sslmode === "prefer" || isSupabase)
    ssl = { rejectUnauthorized: false };

  return { connectionString: url.toString(), ssl };
}

/** Public base URL: APP_URL, else Vercel's production domain, else localhost. */
export function resolveAppUrl(env: Env): string {
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
