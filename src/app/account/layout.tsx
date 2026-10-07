import { Suspense } from "react";

import { AppShell, ShellFallback } from "@/components/shared/app-shell";
import type { NavItem } from "@/components/shared/nav-links";
import { requirePageActor } from "@/server/auth/session";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AccountShell>{children}</AccountShell>
    </Suspense>
  );
}

async function AccountShell({ children }: { children: React.ReactNode }) {
  const actor = await requirePageActor();
  const nav: NavItem[] = [
    ...(actor.coachId ? [{ href: "/coach", label: "Coach", icon: "dashboard" } as const] : []),
    ...(actor.clientId ? [{ href: "/me", label: "Training", icon: "home" } as const] : []),
    { href: "/account", label: "Account", icon: "me" },
  ];
  return (
    <AppShell actor={actor} homeHref="/home" areaLabel="Account" nav={nav}>
      {children}
    </AppShell>
  );
}
