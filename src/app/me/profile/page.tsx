import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { getClientProfileForm } from "@/features/profiles/queries";
import { ClientProfileForm } from "./client-profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ClientProfilePage() {
  const values = await getClientProfileForm();
  return (
    <>
      <PageHeader title="Your profile" description="Shared only with coaches you train with." />
      <ClientProfileForm defaultValues={values} />
    </>
  );
}
