"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { becomeClientAction, becomeCoachAction } from "@/features/onboarding/actions";
import { BecomeCoachSchema } from "@/features/onboarding/schemas";
import { applyActionError, registerWithDefault } from "@/lib/forms";
import { useHydrated } from "@/lib/use-hydrated";
import { COMMON_TIME_ZONES, CURRENCY_CODES } from "@/lib/locale";
import { selectClass } from "@/components/shared/select-class";

type Props = {
  isCoach: boolean;
  isClient: boolean;
  defaultName: string;
  defaultTimezone: string;
};

export function OnboardingChoices({ isCoach, isClient, defaultName, defaultTimezone }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formDefaults = {
    displayName: defaultName,
    timezone: defaultTimezone,
    currency: "PHP" as const,
  };
  const form = useForm<
    z.input<typeof BecomeCoachSchema>,
    unknown,
    z.output<typeof BecomeCoachSchema>
  >({
    resolver: zodResolver(BecomeCoachSchema),
    defaultValues: formDefaults,
  });
  const reg = registerWithDefault(form, formDefaults);
  const hydrated = useHydrated();
  const errors = form.formState.errors;

  const onCoach = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await becomeCoachAction(values);
      if (!result.ok) return applyActionError(result, form.setError);
      toast.success("Your coach profile is ready.");
      router.push("/coach");
    }),
  );

  const onClient = () =>
    startTransition(async () => {
      const result = await becomeClientAction({});
      if (!result.ok) return applyActionError(result);
      router.push("/me");
    });

  const timezones = COMMON_TIME_ZONES.includes(
    defaultTimezone as (typeof COMMON_TIME_ZONES)[number],
  )
    ? COMMON_TIME_ZONES
    : [defaultTimezone, ...COMMON_TIME_ZONES];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>I&apos;m a coach</CardTitle>
          <CardDescription>Manage your schedule, clients, programs and payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {isCoach ? (
            <Button onClick={() => router.push("/coach")}>Go to coach dashboard</Button>
          ) : (
            <form onSubmit={onCoach} className="flex flex-col gap-4" noValidate>
              <fieldset disabled={!hydrated} className="contents">
                <FormField
                  id="displayName"
                  label="Name clients will see"
                  error={errors.displayName?.message}
                >
                  <Input autoComplete="name" {...reg("displayName")} />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="timezone" label="Time zone" error={errors.timezone?.message}>
                    <select className={selectClass} {...reg("timezone")}>
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField id="currency" label="Currency" error={errors.currency?.message}>
                    <select className={selectClass} {...reg("currency")}>
                      {CURRENCY_CODES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <Button type="submit" disabled={pending}>
                  Create coach profile
                </Button>
              </fieldset>
            </form>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>I&apos;m training with a coach</CardTitle>
          <CardDescription>Book sessions, follow your program and track progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {isClient ? (
            <Button variant="outline" onClick={() => router.push("/me")}>
              Go to my bookings
            </Button>
          ) : (
            <Button variant="outline" onClick={onClient} disabled={pending}>
              Continue as a client
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
