"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { acceptInviteAction } from "@/features/clients/actions";
import { applyActionError } from "@/lib/forms";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await acceptInviteAction({ token });
          if (!result.ok) return applyActionError(result);
          toast.success("You're connected!");
          router.push("/me");
        })
      }
    >
      {pending ? "Connecting…" : "Accept invite"}
    </Button>
  );
}
