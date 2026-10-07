import "server-only";

import { requirePageActor } from "@/server/auth/session";
import { inviteUrl, listClients, listMyCoaches } from "@/server/services/coach-client.service";

export async function getCoachClientList() {
  const actor = await requirePageActor();
  const rows = await listClients(actor);
  return rows.map((r) => ({
    linkId: r.id,
    status: r.status,
    name: r.client?.user.name ?? null,
    email: r.client?.user.email ?? r.inviteEmail,
    phone: r.client?.user.phone ?? null,
    inviteUrl: r.status === "INVITED" && r.inviteToken ? inviteUrl(r.inviteToken) : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getMyCoaches() {
  const actor = await requirePageActor();
  return listMyCoaches(actor);
}
