"use server";

import { prisma } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";
import { validateSale, validateCashCount, sanitize } from "@/lib/validators";
import { getManilaDateString } from "@/lib/utils";
import { PaymentMethod, Prisma } from "@prisma/client";
import type {
  ActionResult,
  MenuProductWithVariants,
  SaleWithItems,
  SaleAddOn,
  DailyCashCountWithUser,
} from "@/types";

// ─── Fetch Menu Products & Variants ─────────────────────

export async function getMenuProducts(): Promise<ActionResult<MenuProductWithVariants[]>> {
  try {
    await requireSession();

    const products = await prisma.menuProduct.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return { success: true, data: products as unknown as MenuProductWithVariants[] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load menu";
    return { success: false, error: message };
  }
}

// ─── Daily Flavor / Variant Toggle (Admin only) ─────────

export async function toggleVariantAvailability(
  variantId: string,
  isAvailable: boolean
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.menuVariant.update({
      where: { id: variantId },
      data: { isAvailable },
    });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle flavor";
    return { success: false, error: message };
  }
}

// ─── Record Sale (DATA MODEL C) ─────────────────────────

export async function recordSale({
  id,
  paymentMethod = "CASH",
  notes,
  saleDate,
  items,
  recordedById,
}: {
  id: string; // client-generated UUID for offline sync
  paymentMethod?: "CASH" | "GCASH";
  notes?: string;
  saleDate?: string;
  recordedById?: string;
  items: {
    productId?: string;
    variantId?: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    addOns?: SaleAddOn[];
  }[];
}): Promise<ActionResult<{ saleId: string; totalAmount: number }>> {
  try {
    const session = await requireSession();

    const valError = validateSale({ id, items, paymentMethod });
    if (valError) return { success: false, error: valError };

    // Idempotency check for offline sync
    const existing = await prisma.sale.findUnique({
      where: { id },
    });
    if (existing) {
      return { success: true, data: { saleId: existing.id, totalAmount: existing.totalAmount } };
    }

    const targetDate = saleDate || getManilaDateString();

    // Determine the user to attribute the sale to (original offline recorder or current session)
    let finalRecordedById = session.userId;
    if (recordedById) {
      const userExists = await prisma.user.findUnique({
        where: { id: recordedById },
        select: { id: true },
      });
      if (userExists) {
        finalRecordedById = userExists.id;
      }
    }

    // Compute total amount
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    const sale = await prisma.sale.create({
      data: {
        id,
        paymentMethod: paymentMethod as PaymentMethod,
        totalAmount,
        notes: notes ? sanitize(notes) : null,
        saleDate: targetDate,
        recordedById: finalRecordedById,
        items: {
          create: items.map((item) => ({
            productId: item.productId || null,
            variantId: item.variantId || null,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            addOns: item.addOns ? (item.addOns as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          })),
        },
      },
    });

    return { success: true, data: { saleId: sale.id, totalAmount: sale.totalAmount } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record sale";
    return { success: false, error: message };
  }
}

// ─── Fetch Sales for a Given Day ────────────────────────

export async function getSalesForDay(
  dateStr?: string
): Promise<ActionResult<{ sales: SaleWithItems[]; totals: { total: number; cash: number; gcash: number; count: number } }>> {
  try {
    await requireSession();
    const targetDate = dateStr || getManilaDateString();

    const sales = await prisma.sale.findMany({
      where: { saleDate: targetDate },
      include: {
        items: true,
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let total = 0;
    let cash = 0;
    let gcash = 0;

    for (const s of sales) {
      total += s.totalAmount;
      if (s.paymentMethod === PaymentMethod.CASH) {
        cash += s.totalAmount;
      } else {
        gcash += s.totalAmount;
      }
    }

    return {
      success: true,
      data: {
        sales: sales as unknown as SaleWithItems[],
        totals: {
          total: Math.round(total * 100) / 100,
          cash: Math.round(cash * 100) / 100,
          gcash: Math.round(gcash * 100) / 100,
          count: sales.length,
        },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load sales";
    return { success: false, error: message };
  }
}

// ─── End-of-Day Daily Cash Count (DATA MODEL G) ─────────

export async function saveDailyCashCount({
  countDate,
  startingCash = 0,
  countedCash,
  notes,
  clientCountId,
}: {
  countDate?: string;
  startingCash?: number;
  countedCash: number;
  notes?: string;
  clientCountId?: string;
}): Promise<ActionResult<{ difference: number; expectedCash: number }>> {
  try {
    const session = await requireSession();
    const targetDate = countDate || getManilaDateString();

    const valError = validateCashCount({ countedCash, startingCash });
    if (valError) return { success: false, error: valError };

    // 1. Fetch total Cash sales and GCash sales for the day
    const salesGroup = await prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: { saleDate: targetDate },
      _sum: { totalAmount: true },
    });

    let cashSales = 0;
    let gcashSales = 0;

    for (const group of salesGroup) {
      if (group.paymentMethod === PaymentMethod.CASH) {
        cashSales = group._sum.totalAmount ?? 0;
      } else if (group.paymentMethod === PaymentMethod.GCASH) {
        gcashSales = group._sum.totalAmount ?? 0;
      }
    }

    // Expected cash in drawer = starting cash (change fund) + total Cash sales
    const expectedCash = Math.round((startingCash + cashSales) * 100) / 100;
    const difference = Math.round((countedCash - expectedCash) * 100) / 100;

    // Check if already counted for today and not reopened
    const existing = await prisma.dailyCashCount.findUnique({
      where: { countDate: targetDate },
    });

    if (existing && !existing.isReopened && session.role !== "ADMIN") {
      return {
        success: false,
        error: "Today's cash count has already been submitted. Ask your Admin to reopen it if changes are needed.",
      };
    }

    await prisma.dailyCashCount.upsert({
      where: { countDate: targetDate },
      create: {
        countDate: targetDate,
        startingCash,
        countedCash,
        cashSales,
        gcashSales,
        expectedCash,
        difference,
        notes: notes ? sanitize(notes) : null,
        isReopened: false,
        recordedById: session.userId,
        clientCountId,
      },
      update: {
        startingCash,
        countedCash,
        cashSales,
        gcashSales,
        expectedCash,
        difference,
        notes: notes ? sanitize(notes) : null,
        isReopened: false,
        recordedById: session.userId,
        updatedAt: new Date(),
      },
    });

    return { success: true, data: { difference, expectedCash } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save cash count";
    return { success: false, error: message };
  }
}

// ─── Reopen Daily Cash Count (Admin only) ───────────────

export async function reopenDailyCashCount(
  countDate?: string
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const targetDate = countDate || getManilaDateString();

    await prisma.dailyCashCount.update({
      where: { countDate: targetDate },
      data: { isReopened: true },
    });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reopen cash count";
    return { success: false, error: message };
  }
}

// ─── Fetch Daily Cash Count ─────────────────────────────

export async function getDailyCashCount(
  countDate?: string
): Promise<ActionResult<DailyCashCountWithUser | null>> {
  try {
    await requireSession();
    const targetDate = countDate || getManilaDateString();

    const count = await prisma.dailyCashCount.findUnique({
      where: { countDate: targetDate },
      include: {
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return { success: true, data: count as unknown as DailyCashCountWithUser | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cash count";
    return { success: false, error: message };
  }
}

