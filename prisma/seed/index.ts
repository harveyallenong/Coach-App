// Seed data for local development. Idempotent: safe to run repeatedly.
// Phase 1: admin, 3 coaches, 10 clients, coach–client links, specialties,
// global exercise library. Later phases extend this file (services, packages,
// programs, bookings) so the final seed matches the brief.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../src/generated/prisma/client";
import { pgConnectionOptions, resolveDatabaseUrl } from "../../src/server/database-url";
import { EXERCISES } from "./exercises";

const databaseUrl = resolveDatabaseUrl(process.env);
if (!databaseUrl) throw new Error("DATABASE_URL is not set");
const db = new PrismaClient({
  adapter: new PrismaPg(
    pgConnectionOptions(databaseUrl, process.env.DATABASE_CA_CERT || undefined),
  ),
});

// On a real deployment the seeded @coachbook.local addresses can't receive
// magic links. These let you take over a demo coach/client with your own email.
const SEED_COACH_EMAIL = process.env.SEED_COACH_EMAIL?.trim().toLowerCase() || null;
const SEED_CLIENT_EMAIL = process.env.SEED_CLIENT_EMAIL?.trim().toLowerCase() || null;

const SPECIALTIES = [
  ["strength", "Strength training"],
  ["weight-loss", "Weight loss"],
  ["hypertrophy", "Muscle building"],
  ["mobility", "Mobility & flexibility"],
  ["sports-performance", "Sports performance"],
  ["pre-post-natal", "Pre/post-natal"],
  ["seniors", "Seniors fitness"],
  ["boxing", "Boxing & conditioning"],
  ["running", "Running"],
  ["rehab", "Injury rehab"],
] as const;

const COACHES = [
  {
    email: "coach.ana@coachbook.local",
    name: "Ana Reyes",
    slug: "ana-reyes",
    headline: "Strength & weight-loss coach · 8 yrs",
    bio: "I help busy professionals get strong and lean with 3 sessions a week. In-person in BGC or online.",
    city: "Taguig",
    serviceArea: "BGC, Makati, Pasig",
    timezone: "Asia/Manila",
    currency: "PHP",
    acceptsOnline: true,
    marketplaceVisible: true,
    certifications: [{ name: "NASM-CPT" }, { name: "Precision Nutrition L1" }],
    specialties: ["strength", "weight-loss"],
  },
  {
    email: "coach.marco@coachbook.local",
    name: "Marco Santos",
    slug: "marco-santos",
    headline: "Boxing & conditioning",
    bio: "Pad work, conditioning circuits and small-group bootcamps in Quezon City.",
    city: "Quezon City",
    serviceArea: "QC, San Juan, Mandaluyong",
    timezone: "Asia/Manila",
    currency: "PHP",
    acceptsOnline: false,
    marketplaceVisible: true,
    certifications: [{ name: "ACE-CPT" }],
    specialties: ["boxing", "sports-performance"],
  },
  {
    email: "coach.jess@coachbook.local",
    name: "Jess Carter",
    slug: "jess-carter",
    headline: "Online mobility & running coach",
    bio: "Remote coaching for runners and desk workers: mobility, strength and smart mileage.",
    city: "New York",
    serviceArea: "Online only",
    timezone: "America/New_York",
    currency: "USD",
    acceptsOnline: true,
    marketplaceVisible: false,
    certifications: [{ name: "NSCA-CSCS" }, { name: "RRCA Running Coach" }],
    specialties: ["mobility", "running"],
  },
] as const;

const CLIENTS = [
  ["Bea Lim", "Asia/Manila", "Lose 5kg before December"],
  ["Carlo Mendoza", "Asia/Manila", "Bench 100kg"],
  ["Dana Cruz", "Asia/Manila", "Get back in shape after baby"],
  ["Enzo Villanueva", "Asia/Manila", "Train for first amateur bout"],
  ["Faye Domingo", "Asia/Manila", "Improve stamina"],
  ["Gab Tan", "Asia/Manila", "Build muscle"],
  ["Hannah Ong", "Asia/Manila", "Fix lower-back pain"],
  ["Ivan Garcia", "Asia/Manila", "General fitness"],
  ["Julia Park", "America/New_York", "Sub-2h half marathon"],
  ["Kevin Brooks", "America/Los_Angeles", "Desk-job mobility"],
] as const;

// client index → coach slugs they're linked to (ACTIVE)
const LINKS: Record<number, string[]> = {
  0: ["ana-reyes"],
  1: ["ana-reyes"],
  2: ["ana-reyes"],
  3: ["marco-santos"],
  4: ["marco-santos", "ana-reyes"],
  5: ["marco-santos"],
  6: ["ana-reyes", "jess-carter"],
  7: ["marco-santos"],
  8: ["jess-carter"],
  9: ["jess-carter"],
};

const emailFor = (name: string) => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@coachbook.local`;

/**
 * The seeded user for `defaultEmail`, or — when `overrideEmail` is given — the
 * account with that email (renaming an earlier-seeded placeholder if needed).
 */
async function seedUser(
  defaultEmail: string,
  overrideEmail: string | null,
  data: { name: string; timezone: string; emailVerified: Date },
) {
  const email = overrideEmail ?? defaultEmail;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return existing;
  if (overrideEmail) {
    const placeholder = await db.user.findUnique({ where: { email: defaultEmail } });
    if (placeholder) return db.user.update({ where: { id: placeholder.id }, data: { email } });
  }
  return db.user.create({ data: { email, ...data } });
}

async function main() {
  const now = new Date();

  // Deploys run the seed with SEED_IF_EMPTY=1 so real data is never overwritten.
  if (process.env.SEED_IF_EMPTY === "1" && (await db.coachProfile.count()) > 0) {
    console.log("Database already has data; skipping seed.");
    return;
  }

  await db.user.upsert({
    where: { email: "admin@coachbook.local" },
    update: { isAdmin: true },
    create: {
      email: "admin@coachbook.local",
      name: "Platform Admin",
      isAdmin: true,
      emailVerified: now,
    },
  });

  for (const [slug, name] of SPECIALTIES) {
    await db.specialty.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  }

  const coachIds = new Map<string, string>();
  for (const c of COACHES) {
    const override = c.slug === "ana-reyes" ? SEED_COACH_EMAIL : null;
    const user = await seedUser(c.email, override, {
      name: c.name,
      timezone: c.timezone,
      emailVerified: now,
    });
    const ownProfile = await db.coachProfile.findUnique({ where: { userId: user.id } });
    if (ownProfile && ownProfile.slug !== c.slug) {
      console.warn(
        `${user.email} already has coach profile "${ownProfile.slug}"; not attaching ${c.slug}.`,
      );
      coachIds.set(c.slug, ownProfile.id);
      continue;
    }
    const profile = {
      displayName: c.name,
      headline: c.headline,
      bio: c.bio,
      city: c.city,
      serviceArea: c.serviceArea,
      timezone: c.timezone,
      currency: c.currency,
      acceptsOnline: c.acceptsOnline,
      marketplaceVisible: c.marketplaceVisible,
      certifications: [...c.certifications],
    };
    const coach = await db.coachProfile.upsert({
      where: { slug: c.slug },
      // Only an override moves the profile to a different account.
      update: override ? { ...profile, userId: user.id } : profile,
      create: { ...profile, slug: c.slug, userId: user.id },
    });
    coachIds.set(c.slug, coach.id);
    for (const s of c.specialties) {
      const specialty = await db.specialty.findUniqueOrThrow({ where: { slug: s } });
      await db.coachSpecialty.upsert({
        where: { coachId_specialtyId: { coachId: coach.id, specialtyId: specialty.id } },
        update: {},
        create: { coachId: coach.id, specialtyId: specialty.id },
      });
    }
  }

  for (const [i, [name, timezone, goals]] of CLIENTS.entries()) {
    const override = i === 0 ? SEED_CLIENT_EMAIL : null;
    const user = await seedUser(emailFor(name), override, { name, timezone, emailVerified: now });
    const client = await db.clientProfile.upsert({
      where: { userId: user.id },
      update: { goals },
      create: { userId: user.id, goals, openSlotAlertsOptIn: i % 3 === 0 },
    });
    for (const slug of LINKS[i] ?? []) {
      const coachId = coachIds.get(slug)!; // every slug in LINKS is seeded above
      await db.coachClient.upsert({
        where: { coachId_clientId: { coachId, clientId: client.id } },
        update: { status: "ACTIVE" },
        create: { coachId, clientId: client.id, status: "ACTIVE" },
      });
    }
  }

  // One open invite for Ana, so the invite flow can be tried immediately.
  await db.coachClient.upsert({
    where: { inviteToken: "seed-invite-ana-0000000000000000" },
    update: {},
    create: {
      coachId: coachIds.get("ana-reyes")!,
      inviteToken: "seed-invite-ana-0000000000000000",
      status: "INVITED",
    },
  });

  const existing = new Set(
    (await db.exercise.findMany({ where: { coachId: null }, select: { name: true } })).map(
      (e) => e.name,
    ),
  );
  const missing = EXERCISES.filter(([name]) => !existing.has(name));
  if (missing.length > 0) {
    await db.exercise.createMany({
      data: missing.map(([name, muscleGroups, equipment]) => ({ name, muscleGroups, equipment })),
    });
  }

  const counts = {
    users: await db.user.count(),
    coaches: await db.coachProfile.count(),
    clients: await db.clientProfile.count(),
    links: await db.coachClient.count({ where: { status: "ACTIVE" } }),
    exercises: await db.exercise.count({ where: { coachId: null } }),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
