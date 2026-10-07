import Link from "next/link";

import type { Actor } from "@/server/authz/actor";
import { BottomNav, TopNav, type NavItem } from "./nav-links";
import { UserMenu } from "./user-menu";

type Props = {
  actor: Actor;
  homeHref: string;
  areaLabel: string;
  nav: NavItem[];
  children: React.ReactNode;
};

export function AppShell({ actor, homeHref, areaLabel, nav, children }: Props) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <Link href={homeHref} className="flex items-baseline gap-2 font-bold">
            CoachBook
            <span className="text-muted-foreground text-xs font-medium">{areaLabel}</span>
          </Link>
          <div className="flex-1">
            <TopNav items={nav} />
          </div>
          <UserMenu
            name={actor.name ?? actor.email}
            email={actor.email}
            isCoach={!!actor.coachId}
            isClient={!!actor.clientId}
            isAdmin={actor.isAdmin}
          />
        </div>
      </header>
      <main
        id="main"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-6 pb-24 md:pb-10"
      >
        {children}
      </main>
      <BottomNav items={nav} />
    </div>
  );
}

export function ShellFallback() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true">
      <div className="h-14 border-b" />
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
      </div>
    </div>
  );
}
