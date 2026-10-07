import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AppShell, ShellFallback } from "@/components/shared/app-shell";
import type { NavItem } from "@/components/shared/nav-links";
import { requirePageActor } from "@/server/auth/session";

const NAV: NavItem[] = [
  { href: "/coach", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/coach/clients", label: "Clients", icon: "clients" },
  { href: "/coach/profile", label: "Profile", icon: "profile" },
];

export default function CoachLayout({ children }: LayoutProps<"/coach">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <CoachShell>{children}</CoachShell>
    </Suspense>
  );
}

async function CoachShell({ children }: { children: React.ReactNode }) {
  const actor = await requirePageActor();
  if (!actor.coachId) redirect("/onboarding");
  return (
    <AppShell actor={actor} homeHref="/coach" areaLabel="Coach" nav={NAV}>
      {children}
    </AppShell>
  );
}
