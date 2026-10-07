"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Shield, User, UserCog, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Icons are resolved here because components can't be passed from server to client.
const ICONS = {
  dashboard: LayoutDashboard,
  clients: Users,
  profile: UserCog,
  home: Home,
  me: User,
  admin: Shield,
} satisfies Record<string, LucideIcon>;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function TopNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();
  return (
    <nav aria-label="Main" className="hidden gap-1 md:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item) ? "page" : undefined}
          className={cn(
            "text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 text-sm font-medium",
            "aria-[current=page]:bg-accent aria-[current=page]:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Main"
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs",
                  active && "text-primary font-semibold",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
