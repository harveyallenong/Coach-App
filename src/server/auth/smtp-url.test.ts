import { describe, expect, it } from "vitest";

import { smtpUrl } from "./smtp-url";

describe("smtpUrl", () => {
  it("omits credentials when there is no user (Mailpit)", () => {
    expect(smtpUrl({ host: "localhost", port: 1025 })).toBe("smtp://localhost:1025");
  });

  it("encodes credentials", () => {
    expect(
      smtpUrl({ host: "smtp.resend.com", port: 587, user: "resend", password: "re_a/b@c" }),
    ).toBe("smtp://resend:re_a%2Fb%40c@smtp.resend.com:587");
  });

  it("uses implicit TLS on port 465", () => {
    expect(smtpUrl({ host: "smtp.resend.com", port: 465, user: "resend", password: "x" })).toMatch(
      /^smtps:\/\//,
    );
  });
});
