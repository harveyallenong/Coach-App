"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { archiveClientLinkAction } from "@/features/clients/actions";
import { applyActionError } from "@/lib/forms";
import { CopyButton } from "./copy-button";

type Row = {
  linkId: string;
  status: "INVITED" | "ACTIVE" | "ARCHIVED";
  name: string | null;
  email: string | null;
  phone: string | null;
  inviteUrl: string | null;
};

export function ClientList({ clients }: { clients: Row[] }) {
  const [pending, startTransition] = useTransition();

  if (clients.length === 0) {
    return <p className="text-muted-foreground">No clients yet. Create an invite link above.</p>;
  }

  const archive = (row: Row) => {
    const verb = row.status === "INVITED" ? "Revoke this invite" : "Archive this client";
    if (!confirm(`${verb}?`)) return;
    startTransition(async () => {
      const result = await archiveClientLinkAction({ linkId: row.linkId });
      if (!result.ok) return applyActionError(result);
      toast.success(row.status === "INVITED" ? "Invite revoked" : "Client archived");
    });
  };

  return (
    <ul className="flex flex-col gap-3">
      {clients.map((c) => (
        <li key={c.linkId}>
          <Card className="py-4">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">
                  {c.name ?? c.email ?? "Open invite link"}
                </span>
                {c.name && c.email && (
                  <span className="text-muted-foreground truncate text-sm">{c.email}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>
                  {c.status === "ACTIVE" ? "Active" : "Invite pending"}
                </Badge>
                {c.inviteUrl && <CopyButton value={c.inviteUrl} />}
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => archive(c)}>
                  {c.status === "INVITED" ? "Revoke" : "Archive"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
