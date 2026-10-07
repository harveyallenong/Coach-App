# CLAUDE.md — CoachBook

Scheduling, programming & payments platform for freelance fitness coaches.
The full design is in `docs/PLAN.md`. Read it before changing architecture or the data model.

## Working agreement
- Work **one phase at a time** (see `docs/PLAN.md` §6). At the end of each phase run migrate → seed → lint → typecheck → tests, update the README and `docs/demo/phase-N.md`, summarize, then **stop for review**.
- **Never silently change a Project Decision** (brief §1 or an approved decision in PLAN §9 / `docs/decisions/`). Note ADR 0005: payments are direct-to-coach (GCash/Maya/bank + proof, coach confirms), not Stripe. If something is ambiguous or conflicts, ask. Record approved decisions as ADRs in `docs/decisions/NNNN-title.md`.
- Prefer simple, well-tested code over clever code.
- Every business rule (brief §4) lives in `src/server/domain/` as a pure function and has unit tests.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 + shadcn/ui · PostgreSQL 16 · Prisma 7 · Auth.js v5 (magic link + Google, DB sessions) · Zod 4 · Luxon · pg-boss · Vitest · Playwright · pnpm · Node 22.

## Commands
```bash
pnpm install
pnpm db:up          # docker compose up -d (postgres, mailpit, minio)
pnpm db:migrate     # prisma migrate dev
pnpm db:seed
pnpm db:reset       # drop, migrate, seed
pnpm dev            # web app on :3000
pnpm worker         # background job worker
pnpm lint
pnpm typecheck
pnpm test           # unit + integration
pnpm test:unit      # src/**/*.test.ts
pnpm test:int       # src/**/*.int.test.ts (needs coachbook_test DB)
pnpm test:e2e       # Playwright
```
Local services: Mailpit UI http://localhost:8025, MinIO console http://localhost:9001.

## Layout (short)
- `src/app/` routes only: `(public)`, `(auth)`, `coach/`, `me/` (client), `admin/`, `api/`.
- `src/features/<domain>/` UI components, `actions.ts` (server actions), `queries.ts`, `schemas.ts` (Zod).
- `src/server/domain/` **pure** business rules. No Prisma, no fetch, no `Date.now()`. Take a `now` argument.
- `src/server/services/` use-cases: transactions, authorization, audit log, enqueue jobs.
- `src/server/providers/{payment,video,notification,realtime,storage}/` interface + adapters + `fake`.
- `src/server/jobs/` pg-boss job definitions; `src/worker/index.ts` entrypoint.
- `src/lib/` client-safe helpers only.
- `prisma/migrations/` may contain hand-written SQL (exclusion constraints, generated columns). Never edit an applied migration; add a new one.

## Conventions
**Time**
- Store all instants as `timestamptz` in UTC. Never store local wall-clock instants.
- Coach availability rules are local wall-clock (`weekday`, `startMinute`, `endMinute`) in the coach's IANA timezone. Convert with Luxon only.
- Render in the viewer's timezone. Show the coach's timezone too when it differs.
- Inject time via the `Clock` interface. Don't call `new Date()` or `Date.now()` inside services or domain code.
- Intervals are half-open `[start, end)`.

**Money**
- Integer minor units (`amountMinor: number`) plus an ISO-4217 `currency`. Never use floats for money.
- All rounding goes through `domain/money`.

**Authorization (mandatory)**
- Every server action, route handler and service method authenticates and then authorizes using `server/authz` policies, with row-level ownership checks.
- A coach may only access clients that have an `ACTIVE` `CoachClient` link with them.
- List queries are always scoped (`where: { coachId }` / `{ clientId }`).
- Every new service method gets at least one negative authz test.
- UI code must never import `@/server/db`. ESLint enforces this.

**Validation & actions**
- Every input is parsed with a Zod schema from the feature's `schemas.ts`. Reuse the same schema in forms.
- Write server actions through the `action({ input, rateLimit, handler })` wrapper. Return `Result<T, AppError>` and don't throw to the client.

**Data integrity**
- The DB prevents double-booking: an exclusion constraint on `appointment(coach_id, occupied)` where `status = 'SCHEDULED'`. Don't replace it with app-only checks. Map SQLSTATE `23P01` to `SlotTaken`.
- Group capacity is checked under `SELECT … FOR UPDATE` on the appointment row.
- Changes that move money or credits are idempotent through unique `idempotencyKey` / `dedupeKey` columns.
- Webhooks: verify the signature first, then dedupe on `WebhookEvent(provider, eventId)`.
- Write audit log entries for bookings, cancellations, reschedules, payments, refunds, credit adjustments and admin actions **in the same transaction** as the change.

**Jobs**
- Handlers must be idempotent and safe to retry. Re-read state at execution time, and use `singletonKey` plus DB dedupe keys.

**Providers**
- Business logic depends only on provider interfaces and normalized events. Adding a provider (for example PayMongo) must not touch services or domain code.
- Tests use `fake` adapters.

**Code style**
- TypeScript strict. Avoid `any` and non-null `!` unless a comment explains why.
- Name files in kebab-case. Name React components in PascalCase.
- Server-only modules start with `import 'server-only'`.
- Use shadcn/ui primitives. Design mobile-first. Meet WCAG AA: labels, focus states, keyboard support and contrast.
- Keep comments sparse. Explain *why*, not what.
- Commits: imperative mood, one logical change each, scoped prefix such as `booking: enforce capacity under row lock`.

## Testing
- Unit tests are colocated as `*.test.ts`. Integration tests are `*.int.test.ts` and run against a real Postgres (`coachbook_test`), truncated between tests.
- Domain modules aim for ≥95% line coverage. The slot engine must cover DST transitions in both directions, multiple timezones, buffers at day edges, notice/window boundaries and group slots.
- Build test data with the factories in `tests/factories/`. Don't use raw Prisma creates in tests.

## Environment variables
`.env.example` is the source of truth. `src/server/env.ts` validates it. Only `NEXT_PUBLIC_*` values reach the browser, and they must never contain secrets.
