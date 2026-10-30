/**
 * Input validation schemas for Kream Ko
 *
 * Simple runtime validators for Server Actions and API inputs.
 * Keeps the project dependency-light (no zod needed for this scale).
 */

// ─── Auth ───────────────────────────────────────────────

export function validateEmail(email: string): string | null {
  if (!email || typeof email !== "string") return "Email is required";
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return "Invalid email length";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Invalid email format";
  return null; // valid
}

export function validatePassword(password: string): string | null {
  if (!password || typeof password !== "string") return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long";
  return null;
}

export function validateName(name: string): string | null {
  if (!name || typeof name !== "string") return "Name is required";
  const trimmed = name.trim();
  if (trimmed.length < 1) return "Name is required";
  if (trimmed.length > 100) return "Name is too long";
  return null;
}

// ─── Stock ──────────────────────────────────────────────

export function validateStockItem(data: {
  name?: string;
  category?: string;
  unitLabel?: string;
  lowStockLevel?: number;
  costPrice?: number | null;
}): string | null {
  if (!data.name?.trim()) return "Name is required";
  if (data.name.trim().length > 100) return "Name is too long";
  if (!data.category?.trim()) return "Category is required";
  if (!data.unitLabel?.trim()) return "Unit label is required";
  if (data.lowStockLevel !== undefined && data.lowStockLevel < 0) {
    return "Low stock level cannot be negative";
  }
  if (data.costPrice !== undefined && data.costPrice !== null && data.costPrice < 0) {
    return "Cost price cannot be negative";
  }
  return null;
}

export function validateStockChange(data: {
  stockItemId?: string;
  changeDelta?: number;
  reason?: string;
}): string | null {
  if (!data.stockItemId) return "Stock item is required";
  if (data.changeDelta === undefined || data.changeDelta === null) {
    return "Change amount is required";
  }
  if (!Number.isFinite(data.changeDelta)) return "Invalid change amount";
  if (!data.reason) return "Reason is required";
  return null;
}

// ─── Wastage ────────────────────────────────────────────

export function validateWastage(data: {
  stockItemId?: string;
  quantity?: number;
  reason?: string;
}): string | null {
  if (!data.stockItemId) return "Stock item is required";
  if (!data.quantity || data.quantity <= 0) return "Quantity must be greater than 0";
  if (!Number.isFinite(data.quantity)) return "Invalid quantity";
  if (!data.reason) return "Reason is required";
  const validReasons = ["SPOILED", "SPILLED", "DROPPED", "EXPIRED", "OTHER"];
  if (!validReasons.includes(data.reason)) return "Invalid wastage reason";
  return null;
}

// ─── Menu ───────────────────────────────────────────────

export function validateMenuProduct(data: {
  name?: string;
  category?: string;
}): string | null {
  if (!data.name?.trim()) return "Product name is required";
  if (data.name.trim().length > 100) return "Product name is too long";
  if (!data.category?.trim()) return "Category is required";
  return null;
}

export function validateMenuVariant(data: {
  name?: string;
  price?: number;
}): string | null {
  if (!data.name?.trim()) return "Variant name is required";
  if (data.name.trim().length > 100) return "Variant name is too long";
  if (data.price === undefined || data.price === null) return "Price is required";
  if (data.price < 0) return "Price cannot be negative";
  if (!Number.isFinite(data.price)) return "Invalid price";
  return null;
}

// ─── Sale ───────────────────────────────────────────────

export function validateSale(data: {
  id?: string;
  items?: Array<{ quantity?: number; unitPrice?: number }>;
  paymentMethod?: string;
}): string | null {
  if (!data.id) return "Sale ID is required";
  if (!data.items || data.items.length === 0) return "Sale must have at least one item";
  for (const item of data.items) {
    if (!item.quantity || item.quantity < 1) return "Each item must have quantity ≥ 1";
    if (item.unitPrice === undefined || item.unitPrice < 0) return "Invalid item price";
  }
  if (data.paymentMethod && !["CASH", "GCASH"].includes(data.paymentMethod)) {
    return "Payment method must be Cash or E-Wallet";
  }
  return null;
}

// ─── Cash Count ─────────────────────────────────────────

export function validateCashCount(data: {
  countedCash?: number;
  startingCash?: number;
}): string | null {
  if (data.countedCash === undefined || data.countedCash === null) {
    return "Counted cash is required";
  }
  if (data.countedCash < 0) return "Counted cash cannot be negative";
  if (!Number.isFinite(data.countedCash)) return "Invalid counted cash amount";
  if (data.startingCash !== undefined && data.startingCash < 0) {
    return "Starting cash cannot be negative";
  }
  return null;
}

// ─── Generic ────────────────────────────────────────────

/** Sanitize a string: trim and limit length */
export function sanitize(input: string, maxLength = 500): string {
  return input.trim().slice(0, maxLength);
}

/** Check that a string looks like a UUID */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

