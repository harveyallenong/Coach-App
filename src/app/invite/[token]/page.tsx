import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ShellFallback } from "@/components/shared/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { getInvitePreview } from "@/server/services/coach-client.service";
import { AcceptInviteButton } from "./accept-invite-button";

export const metadata: Metadata = { title: "Coach invite" };

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-12">
      <Suspense fallback={<ShellFallback />}>
        <Invite params={params} />
      </Suspense>
    </main>
  );
}

async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const actor = await getActor();
  if (!actor) redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);

  let preview;
  try {
    preview = await getInvitePreview(actor, token);
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") {
      return (
        <Message
          title="Invite not found"
          body="This link is invalid. Ask your coach for a new one."
        />
      );
    }
    throw err;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle asChild>
          <h1 className="text-xl">Train with {preview.coachName}</h1>
        </CardTitle>
        {(preview.coachHeadline || preview.coachCity) && (
          <CardDescription>
            {[preview.coachHeadline, preview.coachCity].filter(Boolean).join(" · ")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {preview.canAccept ? (
          <>
            <p className="text-muted-foreground text-sm">
              Accepting lets {preview.coachName} see your profile, book sessions with you and share
              programs.
            </p>
            <AcceptInviteButton token={token} />
          </>
        ) : (
          <p role="alert" className="text-destructive text-sm">
            {preview.problem}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle asChild>
          <h1 className="text-xl">{title}</h1>
        </CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}
