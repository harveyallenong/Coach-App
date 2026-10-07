import { describe, expect, it } from "vitest";

import { UpdateAccountSchema, UpdateCoachProfileSchema, certificationsFromText } from "./schemas";

const validCoach = {
  displayName: "Coach Ana",
  headline: "",
  bio: "Strength coach",
  city: "Makati",
  serviceArea: "",
  timezone: "Asia/Manila",
  currency: "PHP",
  acceptsInPerson: true,
  acceptsOnline: false,
  marketplaceVisible: false,
  certifications: ["NASM-CPT"],
} as const;

describe("UpdateCoachProfileSchema", () => {
  it("turns empty optional text into null", () => {
    const out = UpdateCoachProfileSchema.parse(validCoach);
    expect(out.headline).toBeNull();
    expect(out.serviceArea).toBeNull();
    expect(out.bio).toBe("Strength coach");
  });

  it("is idempotent (server re-parses client output)", () => {
    const once = UpdateCoachProfileSchema.parse(validCoach);
    expect(UpdateCoachProfileSchema.parse(once)).toEqual(once);
  });

  it("rejects an invalid time zone and unsupported currency", () => {
    const r = UpdateCoachProfileSchema.safeParse({
      ...validCoach,
      timezone: "Nope/Zone",
      currency: "JPY",
    });
    expect(r.success).toBe(false);
  });
});

describe("certificationsFromText", () => {
  it("splits lines and drops blanks", () => {
    expect(certificationsFromText(" NASM-CPT \n\n PRC Licensed PT\n")).toEqual([
      "NASM-CPT",
      "PRC Licensed PT",
    ]);
  });
});

describe("UpdateAccountSchema", () => {
  it("accepts PH mobile formats and normalises empty phone to null", () => {
    expect(
      UpdateAccountSchema.parse({ name: "A", phone: "+63 917 123 4567", timezone: "Asia/Manila" })
        .phone,
    ).toBe("+63 917 123 4567");
    expect(
      UpdateAccountSchema.parse({ name: "A", phone: "", timezone: "Asia/Manila" }).phone,
    ).toBeNull();
  });

  it("rejects letters in the phone number", () => {
    expect(
      UpdateAccountSchema.safeParse({ name: "A", phone: "call me", timezone: "UTC" }).success,
    ).toBe(false);
  });
});
