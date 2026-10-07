import Link from "next/link";
import { CalendarCheck, Dumbbell, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CalendarCheck,
    title: "Bookings without the back-and-forth",
    body: "Clients pick an open slot. No double-bookings, buffers between sessions, reminders sent for you.",
  },
  {
    icon: Wallet,
    title: "Get paid your way",
    body: "GCash, Maya, bank transfer or cash — track packages, credits and who still owes you.",
  },
  {
    icon: Dumbbell,
    title: "Programs & progress",
    body: "Build programs once, assign them to clients, and see their logs and PRs.",
  },
];

export default function LandingPage() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-12 sm:py-20"
    >
      <section className="flex flex-col gap-6">
        <p className="text-primary text-sm font-semibold tracking-wide uppercase">CoachBook</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Run your coaching business from your phone.
        </h1>
        <p className="text-muted-foreground text-lg">
          Scheduling, client programs and payments for freelance fitness coaches — and an easy way
          for clients to book you.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sign-in">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>
      <section aria-labelledby="features" className="grid gap-6 sm:grid-cols-3">
        <h2 id="features" className="sr-only">
          Features
        </h2>
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-2">
            <Icon className="text-primary size-6" aria-hidden />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-muted-foreground text-sm">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
