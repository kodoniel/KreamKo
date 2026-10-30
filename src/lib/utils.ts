/**
 * Shared utility functions for Kream Ko
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx.
 * Handles conditional classes and deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Philippine Peso currency.
 * e.g. 1234.5 → "₱1,234.50"
 */
export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get the current date string in Manila timezone (YYYY-MM-DD).
 * Used for saleDate, countDate, etc.
 */
export function getManilaDateString(date?: Date): string {
  const d = date ?? new Date();
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }); // en-CA gives YYYY-MM-DD
}

/**
 * Get the current Manila Date object (midnight Manila time).
 */
export function getManilaToday(): Date {
  const manilaStr = getManilaDateString();
  return new Date(manilaStr + "T00:00:00+08:00");
}

/**
 * Format a date for display in Manila timezone.
 * e.g. "Oct 30, 2026"
 */
export function formatManilaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a timestamp for display in Manila timezone.
 * e.g. "Oct 30, 2026, 2:30 PM"
 */
export function formatManilaDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Generate a UUID v4 for client-generated IDs (offline sync).
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Safely parse a float with a fallback.
 */
export function safeParseFloat(value: string, fallback = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely parse an integer with a fallback.
 */
export function safeParseInt(value: string, fallback = 0): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/**
 * Delay utility for async operations.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format the display name of a user who recorded an action.
 * e.g., "Maria", "john" (from email), "Maria (inactive)", or "Unknown".
 */
export function formatRecordedBy(
  user?: { name?: string | null; email?: string | null; isActive?: boolean | null } | null
): string {
  if (!user) return "Unknown";
  let displayName = user.name?.trim();
  if (!displayName && user.email) {
    displayName = user.email.split("@")[0];
  }
  if (!displayName) return "Unknown";
  if (user.isActive === false) {
    return `${displayName} (inactive)`;
  }
  return displayName;
}


