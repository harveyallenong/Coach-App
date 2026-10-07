"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setUserStatusAction } from "@/features/admin/actions";
import { applyActionError } from "@/lib/forms";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
};

export function UserTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const toggle = (u: UserRow) => {
    const status = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (status === "SUSPENDED" && !confirm(`Suspend ${u.email}? They will be signed out.`)) return;
    startTransition(async () => {
      const result = await setUserStatusAction({ userId: u.id, status });
      if (!result.ok) return applyActionError(result);
      toast.success(status === "SUSPENDED" ? "User suspended" : "User reactivated");
    });
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <caption className="sr-only">Users</caption>
        <thead className="bg-muted text-left">
          <tr>
            <th scope="col" className="p-3 font-medium">
              User
            </th>
            <th scope="col" className="p-3 font-medium">
              Roles
            </th>
            <th scope="col" className="p-3 font-medium">
              Status
            </th>
            <th scope="col" className="p-3 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-3">
                <div className="font-medium">{u.name ?? "—"}</div>
                <div className="text-muted-foreground">{u.email}</div>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {u.isAdmin && <Badge>Admin</Badge>}
                  {u.isCoach && <Badge variant="secondary">Coach</Badge>}
                  {u.isClient && <Badge variant="secondary">Client</Badge>}
                </div>
              </td>
              <td className="p-3">
                <Badge variant={u.status === "ACTIVE" ? "outline" : "destructive"}>
                  {u.status}
                </Badge>
              </td>
              <td className="p-3 text-right">
                {u.id !== currentUserId && u.status !== "DELETED" && (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => toggle(u)}>
                    {u.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
