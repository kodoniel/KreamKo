/**
 * Auth Server Actions for Kream Ko
 *
 * Handles login, logout, invite link creation, and registration via invite.
 */

"use server";

import { prisma } from "@/lib/db";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAdmin,
  requireSession,
} from "@/lib/auth";
import { validateEmail, validatePassword, validateName } from "@/lib/validators";
import { INVITE_EXPIRY_MS } from "@/lib/constants";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { ActionResult, SafeUser } from "@/types";

// ─── Login ──────────────────────────────────────────────

export async function login(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  // Validate input
  const emailError = validateEmail(email);
  if (emailError) return { success: false, error: emailError };

  const passwordError = validatePassword(password);
  if (passwordError) return { success: false, error: passwordError };

  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  // Check if active
  if (!user.isActive) {
    return { success: false, error: "Account has been deactivated" };
  }

  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return { success: false, error: "Invalid email or password" };
  }

  // Create session
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await setSessionCookie(token);
  redirect("/");
}

// ─── Logout ─────────────────────────────────────────────

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

// ─── Invite Links (Admin only) ──────────────────────────

export async function createInviteLink(
  role: "ADMIN" | "STAFF" = "STAFF"
): Promise<ActionResult<string>> {
  try {
    const session = await requireAdmin();

    // Generate a cryptographically random token
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();

    await prisma.inviteToken.create({
      data: {
        token,
        role,
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
        createdById: session.userId,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/register?token=${token}`;

    return { success: true, data: inviteUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create invite";
    return { success: false, error: message };
  }
}

// ─── Register via Invite ────────────────────────────────

export async function registerWithInvite(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const token = formData.get("token") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  // Validate inputs
  const nameError = validateName(name);
  if (nameError) return { success: false, error: nameError };

  const emailError = validateEmail(email);
  if (emailError) return { success: false, error: emailError };

  const passwordError = validatePassword(password);
  if (passwordError) return { success: false, error: passwordError };

  if (!token) {
    return { success: false, error: "Invalid invite link" };
  }

  // Find and validate the invite token
  const invite = await prisma.inviteToken.findUnique({ where: { token } });

  if (!invite) {
    return { success: false, error: "Invalid invite link" };
  }

  if (invite.usedAt) {
    return { success: false, error: "This invite link has already been used" };
  }

  if (invite.expiresAt < new Date()) {
    return { success: false, error: "This invite link has expired" };
  }

  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: invite.role,
    },
  });

  // Mark invite as used
  await prisma.inviteToken.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  // Auto-login after registration
  const sessionToken = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await setSessionCookie(sessionToken);
  redirect("/");
}

// ─── User Management (Admin only) ──────────────────────

export async function getUsers(): Promise<ActionResult<SafeUser[]>> {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: users };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users";
    return { success: false, error: message };
  }
}

export async function toggleUserActive(
  userId: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    // Prevent admin from deactivating themselves
    if (userId === session.userId) {
      return { success: false, error: "You cannot deactivate yourself" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return { success: false, error: message };
  }
}

export async function changeUserRole(
  userId: string,
  newRole: "ADMIN" | "STAFF"
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    if (userId === session.userId) {
      return { success: false, error: "You cannot change your own role" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to change role";
    return { success: false, error: message };
  }
}

