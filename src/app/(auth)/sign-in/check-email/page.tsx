import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm text-center">
        <CardHeader className="justify-items-center">
          <MailCheck className="text-primary size-10" aria-hidden />
          <CardTitle asChild>
            <h1 className="text-xl">Check your email</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-4 text-sm">
          <p>We sent you a sign-in link. It expires in 15 minutes.</p>
          <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
            Use a different email
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
