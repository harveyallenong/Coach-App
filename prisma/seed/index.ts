// Seed data for local development. Idempotent: safe to run repeatedly.
// Phase 1: admin, 3 coaches, 10 clients, coach–client links, specialties,
// global exercise library. Later phases extend this file (services, packages,
// programs, bookings) so the final seed matches the brief.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../src/generated/prisma/client";
import { EXERCISES } from "./exercises";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

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

async function main() {
  const now = new Date();

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
    const user = await db.user.upsert({
      where: { email: c.email },
      update: {},
      create: { email: c.email, name: c.name, timezone: c.timezone, emailVerified: now },
    });
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
      update: profile,
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
    const user = await db.user.upsert({
      where: { email: emailFor(name) },
      update: {},
      create: { email: emailFor(name), name, timezone, emailVerified: now },
    });
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
