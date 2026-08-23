import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side guard for protected routes.
 *
 * The session cookie ("token") is set by the TimeLens API on the `localhost`
 * host, so it is shared across ports and readable here. Unguarded /dashboard
 * requests are redirected to /login before any UI renders, so unauthenticated
 * users never see a flash of the dashboard shell.
 */
const AUTH_COOKIE = "token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const hasToken = request.cookies.get(AUTH_COOKIE);
    if (!hasToken) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};