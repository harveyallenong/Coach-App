import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";

loadEnv({ quiet: true });

const serverOnlyStub = new URL("./tests/support/server-only.ts", import.meta.url).pathname;

export default defineConfig({
  resolve: { tsconfigPaths: true, alias: { "server-only": serverOnlyStub } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.int.test.ts", "tests/integration/**/*.int.test.ts"],
          globalSetup: ["tests/integration/global-setup.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          // One shared test database: run files serially.
          fileParallelism: false,
          env: {
            DATABASE_URL:
              process.env.TEST_DATABASE_URL ??
              "postgresql://postgres:postgres@localhost:5432/coachbook_test",
            AUTH_SECRET: process.env.AUTH_SECRET ?? "test-secret-test-secret-test-secret",
            LOG_LEVEL: "silent",
          },
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/server/**", "src/lib/**"],
      exclude: ["src/generated/**"],
    },
  },
});
