import { describe, expect, it } from "vitest";

import { MagicLinkSchema } from "./schemas";

describe("MagicLinkSchema", () => {
  it("lowercases the email", () => {
    expect(MagicLinkSchema.parse({ email: "Ana@Example.COM" }).email).toBe("ana@example.com");
  });

  it("allows same-site callback paths", () => {
    expect(MagicLinkSchema.safeParse({ email: "a@b.co", callbackUrl: "/invite/abc" }).success).toBe(
      true,
    );
  });

  it.each(["https://evil.example", "//evil.example", "javascript:alert(1)"])(
    "rejects open-redirect callback %s",
    (callbackUrl) => {
      expect(MagicLinkSchema.safeParse({ email: "a@b.co", callbackUrl }).success).toBe(false);
    },
  );
});
