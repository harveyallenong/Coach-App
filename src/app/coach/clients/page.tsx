import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCoachClientList } from "@/features/clients/queries";
import { ClientList } from "./client-list";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "Clients" };

export default async function CoachClientsPage() {
  const clients = await getCoachClientList();
  return (
    <>
      <PageHeader title="Clients" description="Invite clients who still book you over chat." />
      <Card>
        <CardHeader>
          <CardTitle>Invite a client</CardTitle>
          <CardDescription>
            Create a link and send it on Messenger or SMS. Add their email to restrict the link to
            them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>
      <section aria-labelledby="client-list" className="flex flex-col gap-3">
        <h2 id="client-list" className="text-lg font-semibold">
          Your clients ({clients.filter((c) => c.status === "ACTIVE").length})
        </h2>
        <ClientList clients={clients} />
      </section>
    </>
  );
}
