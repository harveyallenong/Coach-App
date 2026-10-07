import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only (cookie present). Real authorization happens in every
// page, action and service; this just avoids rendering protected shells for
// signed-out visitors.
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/home",
    "/onboarding",
    "/coach/:path*",
    "/me/:path*",
    "/account/:path*",
    "/admin/:path*",
  ],
};
