import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { getAdminUsers } from "@/features/admin/queries";
import { UserTable } from "./user-table";

export const metadata: Metadata = { title: "Admin · Users" };

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin">) {
  const q = (await searchParams).q;
  const { users, currentUserId } = await getAdminUsers(typeof q === "string" ? q : undefined);
  return (
    <>
      <PageHeader title="Users" description="Suspend accounts that break the rules." />
      <form role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search users
        </label>
        <input
          id="q"
          name="q"
          defaultValue={typeof q === "string" ? q : ""}
          placeholder="Search name or email"
          className="border-input h-10 flex-1 rounded-md border bg-transparent px-3 text-base md:text-sm"
        />
        <button className="hover:bg-accent h-10 rounded-md border px-4 text-sm font-medium">
          Search
        </button>
      </form>
      <UserTable users={users} currentUserId={currentUserId} />
    </>
  );
}
