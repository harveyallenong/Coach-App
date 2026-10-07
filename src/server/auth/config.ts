import "server-only";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/server/db";
import { env } from "@/server/env";
import { logger } from "@/server/logger";
import { smtpUrl } from "./smtp-url";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

export const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

function isAdminEmail(email: string | null | undefined) {
  return !!email && env.ADMIN_EMAILS.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The adapter is typed against the legacy @prisma/client export; the generated
  // Prisma 7 client is structurally identical for the models it touches.
  adapter: PrismaAdapter(db as unknown as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/sign-in", verifyRequest: "/sign-in/check-email", error: "/sign-in" },
  providers: [
    Nodemailer({
      server: smtpUrl({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
      }),
      from: env.EMAIL_FROM,
      maxAge: 15 * 60,
    }),
    ...(googleEnabled
      ? [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })]
      : []),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await db.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { status: true },
      });
      return !existing || existing.status === "ACTIVE";
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id && isAdminEmail(user.email)) {
        await db.user.update({ where: { id: user.id }, data: { isAdmin: true } });
      }
      logger.info({ userId: user.id }, "auth.sign_in");
    },
  },
});
