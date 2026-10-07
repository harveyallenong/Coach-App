"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { requestMagicLink, signInWithGoogle } from "@/features/auth/actions";
import { MagicLinkSchema } from "@/features/auth/schemas";
import { applyActionError } from "@/lib/forms";
import { useHydrated } from "@/lib/use-hydrated";

const ERRORS: Record<string, string> = {
  AccessDenied: "This account can't sign in. Contact support if you think this is a mistake.",
  Verification: "That sign-in link has expired or was already used. Request a new one.",
};

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? undefined;
  const authError = params.get("error");
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const form = useForm<z.input<typeof MagicLinkSchema>, unknown, z.output<typeof MagicLinkSchema>>({
    resolver: zodResolver(MagicLinkSchema),
    defaultValues: { email: "", callbackUrl },
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await requestMagicLink(values);
      if (result && !result.ok) applyActionError(result, form.setError);
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      {authError && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {ERRORS[authError] ?? "Sign-in failed. Please try again."}
        </p>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <fieldset disabled={!hydrated} className="contents">
          <FormField id="email" label="Email" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              inputMode="email"
              {...form.register("email")}
            />
          </FormField>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending link…" : "Email me a sign-in link"}
          </Button>
        </fieldset>
      </form>
      {googleEnabled && (
        <>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <Separator className="flex-1" /> or <Separator className="flex-1" />
          </div>
          <form action={signInWithGoogle}>
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
            <Button type="submit" variant="outline" className="w-full">
              Continue with Google
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
