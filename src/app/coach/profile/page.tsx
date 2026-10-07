import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { getCoachProfileForm } from "@/features/profiles/queries";
import { CoachProfileForm } from "./coach-profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function CoachProfilePage() {
  const { slug, ...values } = await getCoachProfileForm();
  return (
    <>
      <PageHeader
        title="Your coach profile"
        description="This is what clients see when they book you."
      />
      <CoachProfileForm defaultValues={values} slug={slug} />
    </>
  );
}
