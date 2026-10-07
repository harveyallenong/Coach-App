import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ShellFallback } from "@/components/shared/app-shell";
import { requirePageActor } from "@/server/auth/session";

/** Post-sign-in landing: route the user to the right area. */
export default function HomePage() {
  return (
    <Suspense fallback={<ShellFallback />}>
      <RedirectByRole />
    </Suspense>
  );
}

async function RedirectByRole(): Promise<never> {
  const actor = await requirePageActor();
  if (actor.coachId) redirect("/coach");
  if (actor.clientId) redirect("/me");
  redirect("/onboarding");
}
