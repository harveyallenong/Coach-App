"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { FormField } from "@/components/shared/form-field";
import { selectClass } from "@/components/shared/select-class";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateAccountAction } from "@/features/profiles/actions";
import { UpdateAccountSchema } from "@/features/profiles/schemas";
import { applyActionError, registerWithDefault } from "@/lib/forms";
import { useHydrated } from "@/lib/use-hydrated";
import { COMMON_TIME_ZONES } from "@/lib/locale";

type In = z.input<typeof UpdateAccountSchema>;
type Out = z.output<typeof UpdateAccountSchema>;

export function AccountForm({ defaultValues }: { defaultValues: In }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(UpdateAccountSchema),
    defaultValues,
  });
  const reg = registerWithDefault(form, defaultValues);
  const hydrated = useHydrated();
  const errors = form.formState.errors;
  const tz = defaultValues.timezone;
  const timezones = COMMON_TIME_ZONES.includes(tz as (typeof COMMON_TIME_ZONES)[number])
    ? COMMON_TIME_ZONES
    : [tz, ...COMMON_TIME_ZONES];

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateAccountAction(values);
      if (!result.ok) return applyActionError(result, form.setError);
      toast.success("Saved");
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!hydrated} className="contents">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <FormField id="name" label="Full name" error={errors.name?.message}>
              <Input autoComplete="name" {...reg("name")} />
            </FormField>
            <FormField
              id="phone"
              label="Mobile number"
              hint="Used for SMS reminders if you turn them on."
              error={errors.phone?.message}
            >
              <Input type="tel" autoComplete="tel" inputMode="tel" {...reg("phone")} />
            </FormField>
            <FormField
              id="timezone"
              label="Your time zone"
              hint="Session times are shown in this time zone."
              error={errors.timezone?.message}
            >
              <select className={selectClass} {...reg("timezone")}>
                {timezones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </FormField>
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
