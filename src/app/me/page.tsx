import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyCoaches } from "@/features/clients/queries";

export const metadata: Metadata = { title: "Home" };

export default async function ClientHomePage() {
  const coaches = await getMyCoaches();
  return (
    <>
      <PageHeader title="Your training" description="Your coaches and upcoming sessions." />
      <section aria-labelledby="my-coaches" className="flex flex-col gap-3">
        <h2 id="my-coaches" className="text-lg font-semibold">
          Your coaches
        </h2>
        {coaches.length === 0 ? (
          <p className="text-muted-foreground">
            You&apos;re not connected to a coach yet. Ask your coach for their CoachBook invite
            link.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {coaches.map(({ id, coach }) => (
              <li key={id}>
                <Card className="gap-2">
                  <CardHeader>
                    <CardTitle>{coach.displayName}</CardTitle>
                    {(coach.headline || coach.city) && (
                      <CardDescription>
                        {[coach.headline, coach.city].filter(Boolean).join(" · ")}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="text-muted-foreground text-sm">
                    Booking opens in the next release.
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
