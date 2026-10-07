import type { FieldValues, Path, UseFormReturn, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import type { Result } from "./result";

/** Push server-side field errors into the form and toast the message. */
export function applyActionError<T extends FieldValues>(
  result: Extract<Result<unknown>, { ok: false }>,
  setError?: UseFormSetError<T>,
) {
  const { fieldErrors, message } = result.error;
  if (setError && fieldErrors) {
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages?.[0]) setError(field as Path<T>, { message: messages[0] });
    }
  }
  toast.error(message);
}

/**
 * `register` plus a `defaultValue` so the server-rendered HTML already shows the
 * saved value. Without it, react-hook-form fills inputs only after hydration,
 * so slow connections show blank fields that can be typed into and then clobbered.
 */
export function registerWithDefault<T extends FieldValues>(
  form: UseFormReturn<T>,
  defaults: Partial<Record<Path<T>, unknown>>,
) {
  return (name: Path<T>) => {
    const value = defaults[name];
    return {
      ...form.register(name),
      defaultValue: typeof value === "string" ? value : undefined,
    };
  };
}
