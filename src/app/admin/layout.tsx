import { Suspense } from "react";
import { notFound } from "next/navigation";

import { AppShell, ShellFallback } from "@/components/shared/app-shell";
import type { NavItem } from "@/components/shared/nav-links";
import { requirePageActor } from "@/server/auth/session";

const NAV: NavItem[] = [{ href: "/admin", label: "Users", icon: "admin", exact: true }];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const actor = await requirePageActor();
  // Don't reveal that the admin area exists to non-admins.
  if (!actor.isAdmin) notFound();
  return (
    <AppShell actor={actor} homeHref="/admin" areaLabel="Admin" nav={NAV}>
      {children}
    </AppShell>
  );
}
