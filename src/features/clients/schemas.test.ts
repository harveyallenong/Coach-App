import { describe, expect, it } from "vitest";

import { CreateInviteSchema } from "./schemas";

describe("CreateInviteSchema", () => {
  it("treats empty or missing email as an open invite", () => {
    expect(CreateInviteSchema.parse({ email: "" }).email).toBeNull();
    expect(CreateInviteSchema.parse({}).email).toBeNull();
  });

  it("lowercases and is idempotent", () => {
    const once = CreateInviteSchema.parse({ email: "Ana@X.com" });
    expect(once.email).toBe("ana@x.com");
    expect(CreateInviteSchema.parse(once)).toEqual(once);
  });

  it("rejects invalid email", () => {
    expect(CreateInviteSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});
