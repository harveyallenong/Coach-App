# CoachBook

Scheduling, programs and payments for freelance fitness coaches. It's a mobile-first web app that can be installed as a PWA.

- Plan and architecture: [`docs/PLAN.md`](docs/PLAN.md)
- Decisions: [`docs/decisions/`](docs/decisions)
- Conventions for contributors and agents: [`CLAUDE.md`](CLAUDE.md)
- Manual test scripts for each phase: [`docs/demo/`](docs/demo)

## Status

| Phase | Scope | State |
|---|---|---|
| 1 — Foundation | Setup, auth, roles, full data model, profiles, invites, admin users, seed | ✅ done |
| 2 — Scheduling core | Availability, slot engine, booking, calendar | next |
| 3–8 | Policies & notifications, payments, programs, chat, marketplace, hardening | planned |

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 + shadcn/ui (Radix) · PostgreSQL 16 · Prisma 7 · Auth.js v5 (email magic link + Google, database sessions) · Zod 4 · Vitest · pnpm.

## Prerequisites

- Node.js 22+
- pnpm 10 (`corepack enable`)
- Docker, for the local Postgres, Mailpit and MinIO containers. You can use your own Postgres 16 instead (see below).

## Setup

```bash
pnpm install                 # also runs `prisma generate`
cp .env.example .env         # then set AUTH_SECRET (openssl rand -base64 32)
pnpm db:up                   # postgres :5432, mailpit :1025/:8025, minio :9000/:9001
pnpm db:migrate              # apply migrations to the dev DB
pnpm db:seed                 # demo data (safe to re-run)
pnpm dev                     # http://localhost:3000
```

**Signing in.** Enter an email on `/sign-in`, open Mailpit at http://localhost:8025, and click the link.

Seeded accounts. Any email also works and creates a new account.

| Email | Role |
|---|---|
| `admin@coachbook.local` | Admin (also in `ADMIN_EMAILS`) |
| `coach.ana@coachbook.local` | Coach · Manila · PHP · 5 clients |
| `coach.marco@coachbook.local` | Coach · Manila · PHP |
| `coach.jess@coachbook.local` | Coach · New York · USD (private, not on the marketplace) |
| `bea.lim@coachbook.local` … `kevin.brooks@coachbook.local` | 10 clients |

The seed also includes an open invite link for Ana: http://localhost:3000/invite/seed-invite-ana-0000000000000000

**Without Docker.** Point `DATABASE_URL`, `TEST_DATABASE_URL` and `SHADOW_DATABASE_URL` at your own Postgres 16, and create the `coachbook`, `coachbook_test` and `coachbook_shadow` databases. The `btree_gist` extension must be available; it ships with standard Postgres. You also need some SMTP server on `SMTP_HOST:SMTP_PORT` to receive magic links.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev server / production build / production server |
| `pnpm lint` | ESLint, including the rules that keep UI out of the DB and domain code pure |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm typecheck` | Generate route types, then `tsc --noEmit` |
| `pnpm test` | Unit and integration tests |
| `pnpm test:unit` | Pure tests (`src/**/*.test.ts`), no database needed |
| `pnpm test:int` | Integration tests (`*.int.test.ts`) against `TEST_DATABASE_URL`, truncated before every test |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:deploy` | `prisma migrate deploy` (CI / production) |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:reset` | Drop the dev DB, re-apply migrations, seed |
| `pnpm db:studio` | Prisma Studio |

## Environment variables

`.env.example` is the source of truth, and `src/server/env.ts` validates it at startup.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `TEST_DATABASE_URL` | for tests | Must point to a database whose name contains `test`; the test runner refuses anything else |
| `SHADOW_DATABASE_URL` | for `db:migrate` | Prisma's scratch database used to compute migration diffs |
| `AUTH_SECRET` | ✅ | At least 16 characters. Generate with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | | `true` behind proxies and on localhost |
| `APP_URL`, `NEXT_PUBLIC_APP_URL` | | Base URL used in invite links |
| `ADMIN_EMAILS` | | Comma-separated; these users are made admins when they sign in |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | | Enable "Continue with Google". Leave empty to hide the button |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | | Mailpit by default. For Resend use `smtp.resend.com`, port 465, user `resend` and your API key as the password |
| `EMAIL_FROM` | | Sender for magic links |
| `LOG_LEVEL` | | pino level (`info` by default) |

## Project layout

```
prisma/            schema, migrations (incl. hand-written SQL constraints), seed
src/app/           routes: (public), (auth), home, onboarding, coach/, me/, account/, invite/, admin/, api/
src/features/      per-domain schemas (Zod), server actions, queries
src/server/        auth, authz policies, services (use-cases), domain (pure rules), db, env, audit, rate limit
src/components/    ui/ (shadcn) and shared/ app components
tests/             factories, integration setup
```

## How double-booking is prevented

Every occupied coach time slot is an `Appointment` row. Its `occupiedStart`/`occupiedEnd` include the session's buffers (default 5 + 5 min), and a `CHECK` keeps them consistent with the buffers. A Postgres exclusion constraint, `Appointment_no_overlap`, then rejects any two `SCHEDULED` appointments of the same coach whose occupied ranges overlap. This is enforced by the database, so concurrent requests can't race past it; `tests/integration/booking-constraint.int.test.ts` fires 8 parallel inserts and asserts exactly one wins.
