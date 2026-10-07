"use client";

import Link from "next/link";
import { CircleUser } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/features/auth/actions";

type Props = {
  name: string;
  email: string;
  isCoach: boolean;
  isClient: boolean;
  isAdmin: boolean;
};

export function UserMenu({ name, email, isCoach, isClient, isAdmin }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <CircleUser className="size-6" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{name}</span>
          <span className="text-muted-foreground truncate text-xs font-normal">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isCoach && (
          <DropdownMenuItem asChild>
            <Link href="/coach">Coach view</Link>
          </DropdownMenuItem>
        )}
        {isClient && (
          <DropdownMenuItem asChild>
            <Link href="/me">Client view</Link>
          </DropdownMenuItem>
        )}
        {(!isCoach || !isClient) && (
          <DropdownMenuItem asChild>
            <Link href="/onboarding">{isCoach ? "Also book as a client" : "Become a coach"}</Link>
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Admin</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/account">Account settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
