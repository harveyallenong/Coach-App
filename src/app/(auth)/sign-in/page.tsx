import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { googleEnabled } from "@/server/auth/config";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle asChild>
            <h1 className="text-xl">Sign in to CoachBook</h1>
          </CardTitle>
          <CardDescription>We&apos;ll email you a link — no password needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <SignInForm googleEnabled={googleEnabled} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
