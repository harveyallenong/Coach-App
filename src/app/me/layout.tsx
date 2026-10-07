import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AppShell, ShellFallback } from "@/components/shared/app-shell";
import type { NavItem } from "@/components/shared/nav-links";
import { requirePageActor } from "@/server/auth/session";

const NAV: NavItem[] = [
  { href: "/me", label: "Home", icon: "home", exact: true },
  { href: "/me/profile", label: "Profile", icon: "me" },
];

export default function ClientLayout({ children }: LayoutProps<"/me">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <ClientShell>{children}</ClientShell>
    </Suspense>
  );
}

async function ClientShell({ children }: { children: React.ReactNode }) {
  const actor = await requirePageActor();
  if (!actor.clientId) redirect("/onboarding");
  return (
    <AppShell actor={actor} homeHref="/me" areaLabel="Client" nav={NAV}>
      {children}
    </AppShell>
  );
}
