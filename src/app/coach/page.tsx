import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCoachDashboard } from "@/features/coach/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function CoachDashboardPage() {
  const { coach, activeClients, pendingInvites, profileComplete } = await getCoachDashboard();
  const steps = [
    { done: profileComplete, label: "Complete your profile", href: "/coach/profile" },
    { done: activeClients > 0, label: "Invite your first client", href: "/coach/clients" },
  ];
  return (
    <>
      <PageHeader
        title={`Hi, ${coach.displayName}`}
        description="Here's your business at a glance."
      />
      <div className="grid grid-cols-2 gap-4">
        <Card className="gap-2">
          <CardHeader>
            <CardDescription>Active clients</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{activeClients}</CardContent>
        </Card>
        <Card className="gap-2">
          <CardHeader>
            <CardDescription>Pending invites</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{pendingInvites}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 hover:underline">
                  {s.done ? (
                    <CheckCircle2 className="text-primary size-5" aria-label="Done" />
                  ) : (
                    <Circle className="text-muted-foreground size-5" aria-label="To do" />
                  )}
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
