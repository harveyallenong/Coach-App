import { describe, expect, it } from "vitest";

import { checkHealth } from "./health.service";

describe("checkHealth", () => {
  it("reports the database as up", async () => {
    await expect(checkHealth()).resolves.toEqual({ ok: true, database: "up" });
  });
});
