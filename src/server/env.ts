import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { resolveAppUrl, resolveDatabaseUrl } from "./database-url";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url(),
    APP_URL: z.url(),
    /** PEM of the database's CA (Supabase: Database settings → SSL) to verify TLS. */
    DATABASE_CA_CERT: z.preprocess(emptyToUndefined, z.string().optional()),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
    ADMIN_EMAILS: z
      .string()
      .default("")
      .transform((s) =>
        s
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
      .default("info"),
    AUTH_SECRET: z.string().min(16),
    AUTH_GOOGLE_ID: z.preprocess(emptyToUndefined, z.string().optional()),
    AUTH_GOOGLE_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
    SMTP_HOST: z.string().default("localhost"),
    SMTP_PORT: z.coerce.number().int().default(1025),
    SMTP_USER: z.preprocess(emptyToUndefined, z.string().optional()),
    SMTP_PASSWORD: z.preprocess(emptyToUndefined, z.string().optional()),
    EMAIL_FROM: z.string().default("CoachBook <no-reply@coachbook.local>"),
  },
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: resolveDatabaseUrl(process.env),
    APP_URL: resolveAppUrl(process.env),
    DATABASE_CA_CERT: process.env.DATABASE_CA_CERT,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    LOG_LEVEL: process.env.LOG_LEVEL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
