/**
 * Route Proxy for Kream Ko
 *
 * Next.js 16 renamed middleware.ts → proxy.ts
 * Runs on the Node.js runtime on every matched route.
 *
 * Checks for a valid session cookie and redirects
 * unauthenticated users to /login.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySessionToken } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Public routes (no auth needed) ──────────────────
  const publicPaths = ["/login", "/register", "/api/auth"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  // ── Check session cookie ────────────────────────────
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    // No cookie → redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the JWT
  const session = await verifySessionToken(token);

  if (!session) {
    // Invalid or expired token → redirect to login
    const loginUrl = new URL("/login", req.url);
    const response = NextResponse.redirect(loginUrl);
    // Clear the bad cookie
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // ── Admin-only routes ───────────────────────────────
  const adminPaths = ["/users"];
  const isAdminRoute = adminPaths.some((p) => pathname.startsWith(p));

  if (isAdminRoute && session.role !== "ADMIN") {
    // Staff trying to access admin routes → redirect to home
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files (images, manifest, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|manifest\\.json|sw\\.js|icons).*)",
  ],
};

