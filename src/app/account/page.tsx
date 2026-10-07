import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { getAccountForm } from "@/features/profiles/queries";
import { AccountForm } from "./account-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { email, ...values } = await getAccountForm();
  return (
    <>
      <PageHeader title="Account settings" description={`Signed in as ${email}`} />
      <AccountForm defaultValues={values} />
    </>
  );
}
