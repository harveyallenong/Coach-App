"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { FormField } from "@/components/shared/form-field";
import { selectClass } from "@/components/shared/select-class";
import { SwitchField } from "@/components/shared/switch-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateCoachProfileAction } from "@/features/profiles/actions";
import {
  CoachProfileFormSchema,
  certificationsFromText,
  type UpdateCoachProfileInput,
} from "@/features/profiles/schemas";
import { applyActionError, registerWithDefault } from "@/lib/forms";
import { useHydrated } from "@/lib/use-hydrated";
import { COMMON_TIME_ZONES, CURRENCY_CODES } from "@/lib/locale";

type In = z.input<typeof CoachProfileFormSchema>;
type Out = z.output<typeof CoachProfileFormSchema>;

type Props = { defaultValues: UpdateCoachProfileInput; slug: string };

export function CoachProfileForm({ defaultValues, slug }: Props) {
  const [pending, startTransition] = useTransition();
  const { certifications, ...rest } = defaultValues;
  const formDefaults = { ...rest, certificationsText: certifications.join("\n") };
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(CoachProfileFormSchema),
    defaultValues: formDefaults,
  });
  const reg = registerWithDefault(form, formDefaults);
  const hydrated = useHydrated();
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(({ certificationsText, ...values }) =>
    startTransition(async () => {
      const result = await updateCoachProfileAction({
        ...values,
        certifications: certificationsFromText(certificationsText),
      });
      if (!result.ok) return applyActionError(result, form.setError);
      toast.success("Profile saved");
    }),
  );

  const timezones = COMMON_TIME_ZONES.includes(
    defaultValues.timezone as (typeof COMMON_TIME_ZONES)[number],
  )
    ? COMMON_TIME_ZONES
    : [defaultValues.timezone, ...COMMON_TIME_ZONES];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <fieldset disabled={!hydrated} className="contents">
        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField id="displayName" label="Display name" error={errors.displayName?.message}>
              <Input {...reg("displayName")} />
            </FormField>
            <FormField
              id="headline"
              label="Headline"
              hint="e.g. Strength & conditioning coach · 8 years experience"
              error={errors.headline?.message}
            >
              <Input {...reg("headline")} />
            </FormField>
            <FormField id="bio" label="Bio" error={errors.bio?.message}>
              <Textarea rows={5} {...reg("bio")} />
            </FormField>
            <FormField
              id="certificationsText"
              label="Certifications"
              hint="One per line."
              error={errors.certificationsText?.message}
            >
              <Textarea rows={3} {...reg("certificationsText")} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where & how you train</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="city" label="City" error={errors.city?.message}>
                <Input autoComplete="address-level2" {...reg("city")} />
              </FormField>
              <FormField
                id="serviceArea"
                label="Service area"
                hint="e.g. BGC, Makati, Pasig"
                error={errors.serviceArea?.message}
              >
                <Input {...reg("serviceArea")} />
              </FormField>
            </div>
            <Controller
              control={form.control}
              name="acceptsInPerson"
              render={({ field }) => (
                <SwitchField
                  id="acceptsInPerson"
                  label="In-person sessions"
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Controller
              control={form.control}
              name="acceptsOnline"
              render={({ field }) => (
                <SwitchField
                  id="acceptsOnline"
                  label="Online sessions"
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
            <Controller
              control={form.control}
              name="marketplaceVisible"
              render={({ field }) => (
                <SwitchField
                  id="marketplaceVisible"
                  label="List me in the CoachBook marketplace"
                  description={`Off = private: only clients with your invite link can find you. Your profile URL will be /c/${slug}.`}
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </CardContent>
        </Card>

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
