"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInviteAction } from "@/features/clients/actions";
import { CreateInviteSchema } from "@/features/clients/schemas";
import { applyActionError } from "@/lib/forms";
import { useHydrated } from "@/lib/use-hydrated";
import { CopyButton } from "./copy-button";

export function InviteForm() {
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const hydrated = useHydrated();
  const form = useForm<
    z.input<typeof CreateInviteSchema>,
    unknown,
    z.output<typeof CreateInviteSchema>
  >({
    resolver: zodResolver(CreateInviteSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await createInviteAction(values);
      if (!result.ok) return applyActionError(result, form.setError);
      setUrl(result.data.url);
      form.reset();
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
        <fieldset disabled={!hydrated} className="contents">
          <FormField
            id="invite-email"
            label="Client email (optional)"
            error={form.formState.errors.email?.message}
            className="flex-1"
          >
            <Input type="email" autoComplete="off" {...form.register("email")} />
          </FormField>
          <Button type="submit" disabled={pending}>
            Create invite link
          </Button>
        </fieldset>
      </form>
      {url && (
        <div className="bg-accent flex flex-col gap-2 rounded-md p-3" aria-live="polite">
          <p className="text-sm font-medium">Invite link ready</p>
          <code className="text-sm break-all">{url}</code>
          <div>
            <CopyButton value={url} />
          </div>
        </div>
      )}
    </div>
  );
}
