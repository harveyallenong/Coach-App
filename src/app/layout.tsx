import type { Metadata, Viewport } from "next";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CoachBook", template: "%s · CoachBook" },
  description: "Scheduling, programs and payments for freelance fitness coaches.",
  applicationName: "CoachBook",
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="focus:bg-background sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
