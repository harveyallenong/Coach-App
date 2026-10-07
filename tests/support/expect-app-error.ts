import { expect } from "vitest";

import type { AppErrorCode } from "@/lib/result";
import { AppError } from "@/server/errors";

export async function expectAppError(promise: Promise<unknown>, code: AppErrorCode) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err, `expected AppError ${code}`).toBeInstanceOf(AppError);
  expect((err as AppError).code).toBe(code);
  return err as AppError;
}
