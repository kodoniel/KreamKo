/**
 * JWT Session Management for Kream Ko
 *
 * Uses the `jose` library to sign/verify JWT tokens stored in HttpOnly cookies.
 * Sessions last 30 days so staff phones stay logged in.
 *
 * IMPORTANT (Next.js 16): cookies() is async — must be awaited.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "./constants";
import type { SessionPayload } from "@/types";

// Secret key for signing JWTs — derived from the AUTH_SECRET env var
const secretKey = new TextEncoder().encode(process.env.AUTH_SECRET);

/**
 * Create a signed JWT from a session payload.
 */
export async function createSessionToken(
  payload: Omit<SessionPayload, "expiresAt">
): Promise<string> {
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_SECONDS * 1000
  ).toISOString();

  return new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verify a JWT token and return the session payload.
 * Returns null if the token is invalid or expired.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set the session cookie after login.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the current session from cookies.
 * Returns null if not logged in or token is invalid.
 *
 * Use this in Server Components and Server Actions to check auth.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Require a valid session or throw.
 * Use in Server Actions that need authentication.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session;
}

/**
 * Require admin role or throw.
 * Use in Server Actions that need admin privileges.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  return session;
}

