import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { Actor } from "@/server/authz/actor";
import { unauthenticated } from "@/server/errors";
import { auth } from "./config";
import { loadActor } from "./load-actor";

/** Current actor for this request (deduplicated per request), or null. */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return loadActor(session.user.id);
});

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw unauthenticated();
  return actor;
}

/** For pages/layouts: redirect to sign-in instead of throwing. */
export async function requirePageActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/sign-in");
  return actor;
}
