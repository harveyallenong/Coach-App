import { execSync } from "node:child_process";

/** Bring the test database schema up to date once per run. */
export default function setup() {
  const url =
    process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/coachbook_test";
  if (!/test/.test(new URL(url).pathname)) {
    throw new Error(`Refusing to run integration tests against non-test database: ${url}`);
  }
  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
