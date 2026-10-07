import type { Metadata } from "next";
import { Suspense } from "react";

import { ShellFallback } from "@/components/shared/app-shell";
import { requirePageActor } from "@/server/auth/session";
import { OnboardingChoices } from "./onboarding-choices";

export const metadata: Metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to CoachBook</h1>
        <p className="text-muted-foreground">How will you use CoachBook? You can do both.</p>
      </div>
      <Suspense fallback={<ShellFallback />}>
        <Choices />
      </Suspense>
    </main>
  );
}

async function Choices() {
  const actor = await requirePageActor();
  return (
    <OnboardingChoices
      isCoach={!!actor.coachId}
      isClient={!!actor.clientId}
      defaultName={actor.name ?? ""}
      defaultTimezone={actor.timezone}
    />
  );
}
