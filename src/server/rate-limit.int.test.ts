import { describe, expect, it } from "vitest";

import { fixedClock } from "./clock";
import { enforce, hit } from "./rate-limit";
import { expectAppError } from "../../tests/support/expect-app-error";

const rule = { limit: 3, windowSec: 60 };

describe("rate limiter", () => {
  it("allows up to the limit within a window", async () => {
    const clock = fixedClock("2026-10-07T00:00:00Z");
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await hit("k", rule, { clock })).allowed);
    expect(results).toEqual([true, true, true, false]);
  });

  it("resets after the window", async () => {
    for (let i = 0; i < 4; i++) await hit("k", rule, { clock: fixedClock("2026-10-07T00:00:00Z") });
    const later = await hit("k", rule, { clock: fixedClock("2026-10-07T00:01:00Z") });
    expect(later).toEqual({ allowed: true, count: 1 });
  });

  it("counts concurrent hits atomically", async () => {
    const clock = fixedClock("2026-10-07T00:00:00Z");
    const results = await Promise.all(Array.from({ length: 10 }, () => hit("c", rule, { clock })));
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
  });

  it("enforce throws RATE_LIMITED", async () => {
    const clock = fixedClock("2026-10-07T00:00:00Z");
    for (let i = 0; i < 3; i++) await enforce("e", rule, { clock });
    await expectAppError(enforce("e", rule, { clock }), "RATE_LIMITED");
  });
});
