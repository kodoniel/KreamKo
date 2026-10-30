/**
 * Application-wide constants for Kream Ko
 */

// ─── Stock Categories ───────────────────────────────────
export const STOCK_CATEGORIES = [
  "Ice cream powders",
  "Syrups",
  "Float ingredients",
  "Toppings",
  "Snacks",
  "Cones",
  "Cups & lids",
  "Straws",
  "Packaging",
  "Fries seasoning",
  "Condiments",
  "Supplies",
  "Water",
] as const;

// ─── Menu Categories ────────────────────────────────────
export const MENU_CATEGORIES = [
  "Ice Cream",
  "Ice Cream Tub",
  "Sundae",
  "Floats",
  "French Fries",
  "Hotdog",
  "Add-ons",
  "Dips",
] as const;

// ─── Payment Methods ────────────────────────────────────
export const PAYMENT_METHODS = ["CASH", "GCASH"] as const;

// ─── Stock Change Reasons ───────────────────────────────
export const STOCK_CHANGE_REASONS = [
  "RESTOCK",
  "DAMAGE",
  "ADJUSTMENT",
  "MANUAL_COUNT",
  "END_OF_DAY_COUNT",
  "WASTAGE",
] as const;

export const STOCK_REASON_LABELS: Record<string, string> = {
  RESTOCK: "Restock",
  DAMAGE: "Damage",
  ADJUSTMENT: "Adjustment",
  MANUAL_COUNT: "Manual Count",
  END_OF_DAY_COUNT: "End-of-Day Count",
  WASTAGE: "Wastage",
};

// ─── Wastage Reasons ────────────────────────────────────
export const WASTAGE_REASONS = [
  "SPOILED",
  "SPILLED",
  "DROPPED",
  "EXPIRED",
  "OTHER",
] as const;

export const WASTAGE_REASON_LABELS: Record<string, string> = {
  SPOILED: "Spoiled",
  SPILLED: "Spilled",
  DROPPED: "Dropped",
  EXPIRED: "Expired",
  OTHER: "Other",
};

// ─── Session ────────────────────────────────────────────
/** Session cookie name */
export const SESSION_COOKIE_NAME = "kreamko-session";

/** Session duration: 30 days in seconds */
export const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60;

/** Invite link expiry: 48 hours in milliseconds */
export const INVITE_EXPIRY_MS = 48 * 60 * 60 * 1000;

// ─── Unit Labels ────────────────────────────────────────
export const DEFAULT_UNIT_LABELS = [
  "pack",
  "pcs",
  "bottle",
  "gallon",
  "box",
  "roll",
  "bag",
] as const;

// ─── UI ─────────────────────────────────────────────────
/** Number of items per page in lists */
export const PAGE_SIZE = 50;

/** Low stock threshold multiplier for "urgent" badge */
export const URGENT_STOCK_MULTIPLIER = 0.5;

// ─── App Info ───────────────────────────────────────────
export const APP_NAME = "Kream Ko";
export const APP_DESCRIPTION = "Stock & Sales Tracker";
export const APP_TIMEZONE = "Asia/Manila";

