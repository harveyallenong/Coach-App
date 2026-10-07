// Client-safe result type returned by every server action.

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionError = {
  code: AppErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: ActionError };
