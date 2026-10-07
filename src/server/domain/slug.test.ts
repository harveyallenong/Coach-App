import { describe, expect, it } from "vitest";

import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Coach Ana Cruz")).toBe("coach-ana-cruz");
  });

  it("strips diacritics and punctuation", () => {
    expect(slugify("  Niño's  Bootcamp!! ")).toBe("nino-s-bootcamp");
  });

  it("falls back when nothing usable remains", () => {
    expect(slugify("!!!")).toBe("coach");
    expect(slugify("")).toBe("coach");
  });

  it("truncates without leaving a trailing hyphen", () => {
    const slug = slugify("a".repeat(39) + " bcd", 40);
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("returns the base when free", () => {
    expect(uniqueSlug("ana", new Set())).toBe("ana");
  });

  it("appends the first free numeric suffix", () => {
    expect(uniqueSlug("ana", new Set(["ana", "ana-2"]))).toBe("ana-3");
  });

  it("fills gaps", () => {
    expect(uniqueSlug("ana", new Set(["ana", "ana-3"]))).toBe("ana-2");
  });
});
