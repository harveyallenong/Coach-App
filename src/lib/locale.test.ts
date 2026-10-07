import { describe, expect, it } from "vitest";

import { isValidTimeZone } from "./locale";

describe("isValidTimeZone", () => {
  it.each(["Asia/Manila", "America/New_York", "UTC", "Europe/London"])("accepts %s", (tz) => {
    expect(isValidTimeZone(tz)).toBe(true);
  });

  it.each(["", "Mars/Olympus", "GMT+99", "not a zone"])("rejects %j", (tz) => {
    expect(isValidTimeZone(tz)).toBe(false);
  });
});
