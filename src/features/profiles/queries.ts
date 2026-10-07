import "server-only";

import { requirePageActor } from "@/server/auth/session";
import { requireCoachRole } from "@/server/authz/policies";
import {
  getAccount,
  getCoachProfile,
  getOwnClientProfile,
} from "@/server/services/profile.service";
import type { UpdateCoachProfileInput } from "./schemas";

export async function getCoachProfileForm(): Promise<UpdateCoachProfileInput & { slug: string }> {
  const actor = await requirePageActor();
  const c = await getCoachProfile(actor, requireCoachRole(actor));
  const certs = Array.isArray(c.certifications) ? c.certifications : [];
  return {
    slug: c.slug,
    displayName: c.displayName,
    headline: c.headline ?? "",
    bio: c.bio ?? "",
    city: c.city ?? "",
    serviceArea: c.serviceArea ?? "",
    timezone: c.timezone,
    currency: c.currency as UpdateCoachProfileInput["currency"],
    acceptsInPerson: c.acceptsInPerson,
    acceptsOnline: c.acceptsOnline,
    marketplaceVisible: c.marketplaceVisible,
    certifications: certs.flatMap((x) =>
      x && typeof x === "object" && "name" in x && typeof x.name === "string" ? [x.name] : [],
    ),
  };
}

export async function getClientProfileForm() {
  const actor = await requirePageActor();
  const c = await getOwnClientProfile(actor);
  return {
    goals: c.goals ?? "",
    healthNotes: c.healthNotes ?? "",
    openSlotAlertsOptIn: c.openSlotAlertsOptIn,
  };
}

export async function getAccountForm() {
  const actor = await requirePageActor();
  const u = await getAccount(actor);
  return { email: u.email, name: u.name ?? "", phone: u.phone ?? "", timezone: u.timezone };
}
