import type { AppErrorCode, FieldErrors } from "@/lib/result";

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const unauthenticated = () => new AppError("UNAUTHENTICATED", "Please sign in to continue.");
export const forbidden = (message = "You don't have access to this.") =>
  new AppError("FORBIDDEN", message);
export const notFound = (what = "Item") => new AppError("NOT_FOUND", `${what} not found.`);
export const conflict = (message: string) => new AppError("CONFLICT", message);
export const validation = (message: string, fieldErrors?: FieldErrors) =>
  new AppError("VALIDATION", message, fieldErrors);
