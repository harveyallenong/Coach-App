"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { FormField } from "@/components/shared/form-field";
import { SwitchField } from "@/components/shared/switch-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateClientProfileAction } from "@/features/profiles/actions";
import { UpdateClientProfileSchema } from "@/features/profiles/schemas";
import { applyActionError, registerWithDefault } from "@/lib/forms";
import { useHydrated } from "@/lib/use-hydrated";

type In = z.input<typeof UpdateClientProfileSchema>;
type Out = z.output<typeof UpdateClientProfileSchema>;

export function ClientProfileForm({ defaultValues }: { defaultValues: In }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(UpdateClientProfileSchema),
    defaultValues,
  });
  const reg = registerWithDefault(form, defaultValues);
  const hydrated = useHydrated();
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateClientProfileAction(values);
      if (!result.ok) return applyActionError(result, form.setError);
      toast.success("Profile saved");
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!hydrated} className="contents">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <FormField id="goals" label="Your goals" error={errors.goals?.message}>
              <Textarea rows={3} {...reg("goals")} />
            </FormField>
            <FormField
              id="healthNotes"
              label="Injuries or health notes"
              hint="Anything your coach should know before training you."
              error={errors.healthNotes?.message}
            >
              <Textarea rows={3} {...reg("healthNotes")} />
            </FormField>
            <Controller
              control={form.control}
              name="openSlotAlertsOptIn"
              render={({ field }) => (
                <SwitchField
                  id="openSlotAlertsOptIn"
                  label="Tell me when a slot opens up"
                  description="Get notified when one of your coaches has a last-minute opening."
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <div>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </fieldset>
    </form>
  );
}
