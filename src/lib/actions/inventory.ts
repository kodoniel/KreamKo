"use server";

import { prisma } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";
import {
  validateStockItem,
  validateStockChange,
  validateWastage,
  sanitize,
} from "@/lib/validators";
import { getManilaDateString } from "@/lib/utils";
import { StockChangeReason, WastageReason } from "@prisma/client";
import type {
  ActionResult,
  StockItemWithLogs,
  WastageLogWithItem,
  EODStockCountWithItems,
} from "@/types";

// ─── Fetch Stock Items ──────────────────────────────────

export async function getStockItems(
  includeArchived = false
): Promise<ActionResult<StockItemWithLogs[]>> {
  try {
    await requireSession();

    const items = await prisma.stockItem.findMany({
      where: includeArchived ? {} : { isActive: true },
      include: {
        stockLogs: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return { success: true, data: items as unknown as StockItemWithLogs[] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load stock";
    return { success: false, error: message };
  }
}

// ─── Adjust Stock (+/- or manual typed count) ───────────

export async function adjustStock({
  stockItemId,
  changeDelta,
  reason,
  notes,
  clientLogId,
}: {
  stockItemId: string;
  changeDelta: number;
  reason: keyof typeof StockChangeReason;
  notes?: string;
  clientLogId?: string;
}): Promise<ActionResult<{ newQty: number }>> {
  try {
    const session = await requireSession();

    const valError = validateStockChange({ stockItemId, changeDelta, reason });
    if (valError) return { success: false, error: valError };

    // Idempotent check for offline sync
    if (clientLogId) {
      const existing = await prisma.stockLog.findUnique({
        where: { clientLogId },
      });
      if (existing) {
        return { success: true, data: { newQty: existing.afterQty } };
      }
    }

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.findUnique({
        where: { id: stockItemId },
      });
      if (!item) throw new Error("Stock item not found");

      const beforeQty = item.currentQuantity;
      const afterQty = Math.max(0, Math.round((beforeQty + changeDelta) * 100) / 100);

      const log = await tx.stockLog.create({
        data: {
          stockItemId,
          changeDelta,
          beforeQty,
          afterQty,
          reason: reason as StockChangeReason,
          notes: notes ? sanitize(notes) : null,
          userId: session.userId,
          clientLogId,
        },
      });

      await tx.stockItem.update({
        where: { id: stockItemId },
        data: { currentQuantity: afterQty },
      });

      return { newQty: afterQty };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to adjust stock";
    return { success: false, error: message };
  }
}

// ─── Restock Action (with optional cost) ─────────────────

export async function restockItem({
  stockItemId,
  quantityAdded,
  costPrice,
  notes,
  clientLogId,
}: {
  stockItemId: string;
  quantityAdded: number;
  costPrice?: number;
  notes?: string;
  clientLogId?: string;
}): Promise<ActionResult<{ newQty: number }>> {
  try {
    const session = await requireSession();

    if (quantityAdded <= 0) {
      return { success: false, error: "Restock quantity must be greater than 0" };
    }

    if (clientLogId) {
      const existing = await prisma.stockLog.findUnique({
        where: { clientLogId },
      });
      if (existing) {
        return { success: true, data: { newQty: existing.afterQty } };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.findUnique({
        where: { id: stockItemId },
      });
      if (!item) throw new Error("Stock item not found");

      const beforeQty = item.currentQuantity;
      const afterQty = Math.round((beforeQty + quantityAdded) * 100) / 100;

      await tx.stockLog.create({
        data: {
          stockItemId,
          changeDelta: quantityAdded,
          beforeQty,
          afterQty,
          reason: StockChangeReason.RESTOCK,
          costPrice: costPrice !== undefined && costPrice > 0 ? costPrice : null,
          notes: notes ? sanitize(notes) : null,
          userId: session.userId,
          clientLogId,
        },
      });

      // Optionally update default cost price if provided and user is Admin
      const updateData: { currentQuantity: number; costPrice?: number } = {
        currentQuantity: afterQty,
      };
      if (costPrice !== undefined && costPrice > 0 && session.role === "ADMIN") {
        updateData.costPrice = costPrice;
      }

      await tx.stockItem.update({
        where: { id: stockItemId },
        data: updateData,
      });

      return { newQty: afterQty };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restock";
    return { success: false, error: message };
  }
}

// ─── Log Wastage (DATA MODEL F) ─────────────────────────

export async function logWastage({
  stockItemId,
  quantity,
  reason,
  notes,
  clientWastageId,
}: {
  stockItemId: string;
  quantity: number;
  reason: keyof typeof WastageReason;
  notes?: string;
  clientWastageId?: string;
}): Promise<ActionResult<{ newQty: number; wastageId: string }>> {
  try {
    const session = await requireSession();

    const valError = validateWastage({ stockItemId, quantity, reason });
    if (valError) return { success: false, error: valError };

    // Idempotency check
    if (clientWastageId) {
      const existing = await prisma.wastageLog.findUnique({
        where: { clientWastageId },
      });
      if (existing) {
        const item = await prisma.stockItem.findUnique({
          where: { id: stockItemId },
        });
        return {
          success: true,
          data: { newQty: item?.currentQuantity ?? 0, wastageId: existing.id },
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.findUnique({
        where: { id: stockItemId },
      });
      if (!item) throw new Error("Stock item not found");

      const beforeQty = item.currentQuantity;
      const afterQty = Math.max(0, Math.round((beforeQty - quantity) * 100) / 100);

      // 1. Create Wastage record
      const wastage = await tx.wastageLog.create({
        data: {
          stockItemId,
          quantity,
          reason: reason as WastageReason,
          notes: notes ? sanitize(notes) : null,
          recordedById: session.userId,
          clientWastageId,
        },
      });

      // 2. Create StockLog entry for audit trail
      await tx.stockLog.create({
        data: {
          stockItemId,
          changeDelta: -quantity,
          beforeQty,
          afterQty,
          reason: StockChangeReason.WASTAGE,
          notes: `Wastage: ${reason}${notes ? ` - ${sanitize(notes)}` : ""}`,
          userId: session.userId,
        },
      });

      // 3. Update stock quantity
      await tx.stockItem.update({
        where: { id: stockItemId },
        data: { currentQuantity: afterQty },
      });

      return { newQty: afterQty, wastageId: wastage.id };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log wastage";
    return { success: false, error: message };
  }
}

// ─── Delete Wastage (Admin only) ────────────────────────

export async function deleteWastage(
  wastageId: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    await prisma.$transaction(async (tx) => {
      const wastage = await tx.wastageLog.findUnique({
        where: { id: wastageId },
        include: { stockItem: true },
      });
      if (!wastage) throw new Error("Wastage record not found");

      // Revert stock reduction
      const beforeQty = wastage.stockItem.currentQuantity;
      const afterQty = Math.round((beforeQty + wastage.quantity) * 100) / 100;

      await tx.stockLog.create({
        data: {
          stockItemId: wastage.stockItemId,
          changeDelta: wastage.quantity,
          beforeQty,
          afterQty,
          reason: StockChangeReason.ADJUSTMENT,
          notes: `Admin reverted deleted wastage #${wastageId.slice(0, 8)}`,
          userId: session.userId,
        },
      });

      await tx.stockItem.update({
        where: { id: wastage.stockItemId },
        data: { currentQuantity: afterQty },
      });

      await tx.wastageLog.delete({
        where: { id: wastageId },
      });
    });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete wastage";
    return { success: false, error: message };
  }
}

// ─── End-of-Day Stock Count (DATA MODEL E) ──────────────

export async function saveEndOfDayStockCount({
  countDate,
  items,
  notes,
  clientCountId,
}: {
  countDate?: string;
  items: { stockItemId: string; remainingQty: number }[];
  notes?: string;
  clientCountId?: string;
}): Promise<ActionResult<{ countId: string }>> {
  try {
    const session = await requireSession();
    const targetDate = countDate || getManilaDateString();

    if (!items || items.length === 0) {
      return { success: false, error: "Please enter at least one item count" };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current start of day / baseline and day's restocks + wastage
      const dayStart = new Date(`${targetDate}T00:00:00+08:00`);
      const dayEnd = new Date(`${targetDate}T23:59:59.999+08:00`);

      // Create or update EndOfDayStockCount
      const eodCount = await tx.endOfDayStockCount.upsert({
        where: { countDate: targetDate },
        create: {
          countDate: targetDate,
          recordedById: session.userId,
          notes: notes ? sanitize(notes) : null,
          clientCountId,
        },
        update: {
          recordedById: session.userId,
          notes: notes ? sanitize(notes) : null,
          updatedAt: new Date(),
        },
      });

      for (const entry of items) {
        const item = await tx.stockItem.findUnique({
          where: { id: entry.stockItemId },
        });
        if (!item) continue;

        // Sum restocks for this item today
        const restocks = await tx.stockLog.aggregate({
          where: {
            stockItemId: item.id,
            reason: StockChangeReason.RESTOCK,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { changeDelta: true },
        });
        const restockedQty = restocks._sum.changeDelta ?? 0;

        // Sum wastage for this item today
        const wastage = await tx.wastageLog.aggregate({
          where: {
            stockItemId: item.id,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { quantity: true },
        });
        const loggedWastage = wastage._sum.quantity ?? 0;

        // Previous baseline quantity before day's adjustments
        const previousQty = item.currentQuantity;
        const newRemaining = Math.max(0, entry.remainingQty);

        // Calculation specified in spec:
        // total decrease = previous count + restocks - new count
        // used = total decrease - logged wastage
        const totalDecrease = Math.max(0, previousQty + restockedQty - newRemaining);
        const usedQty = Math.max(0, totalDecrease - loggedWastage);

        // Upsert count item
        await tx.endOfDayStockCountItem.upsert({
          where: {
            countId_stockItemId: {
              countId: eodCount.id,
              stockItemId: item.id,
            },
          },
          create: {
            countId: eodCount.id,
            stockItemId: item.id,
            remainingQty: newRemaining,
            previousQty,
            restockedQty,
            totalDecrease,
            loggedWastage,
            usedQty,
          },
          update: {
            remainingQty: newRemaining,
            previousQty,
            restockedQty,
            totalDecrease,
            loggedWastage,
            usedQty,
          },
        });

        // Update item's currentQuantity to the newly counted remaining amount
        if (newRemaining !== item.currentQuantity) {
          const delta = newRemaining - item.currentQuantity;
          await tx.stockLog.create({
            data: {
              stockItemId: item.id,
              changeDelta: delta,
              beforeQty: item.currentQuantity,
              afterQty: newRemaining,
              reason: StockChangeReason.END_OF_DAY_COUNT,
              notes: `End-of-day count: set to ${newRemaining}`,
              userId: session.userId,
            },
          });

          await tx.stockItem.update({
            where: { id: item.id },
            data: { currentQuantity: newRemaining },
          });
        }
      }

      return { countId: eodCount.id };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save count";
    return { success: false, error: message };
  }
}

// ─── Add / Edit / Archive Stock Item (Admin only) ───────

export async function addStockItem(data: {
  name: string;
  category: string;
  unitLabel: string;
  currentQuantity?: number;
  lowStockLevel?: number;
  costPrice?: number | null;
  image?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin();

    const valError = validateStockItem(data);
    if (valError) return { success: false, error: valError };

    const initialQty = data.currentQuantity && data.currentQuantity > 0 ? data.currentQuantity : 0;

    const item = await prisma.stockItem.create({
      data: {
        name: sanitize(data.name),
        category: sanitize(data.category),
        unitLabel: sanitize(data.unitLabel) || "pack",
        currentQuantity: initialQty,
        lowStockLevel: data.lowStockLevel !== undefined && data.lowStockLevel >= 0 ? data.lowStockLevel : 2,
        costPrice: data.costPrice && data.costPrice > 0 ? data.costPrice : null,
        image: data.image || null,
        isActive: true,
      },
    });

    if (initialQty > 0) {
      await prisma.stockLog.create({
        data: {
          stockItemId: item.id,
          changeDelta: initialQty,
          beforeQty: 0,
          afterQty: initialQty,
          reason: StockChangeReason.MANUAL_COUNT,
          notes: "Initial stock quantity on creation",
          userId: session.userId,
        },
      });
    }

    return { success: true, data: { id: item.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add item";
    return { success: false, error: message };
  }
}

export async function updateStockItem(
  id: string,
  data: {
    name: string;
    category: string;
    unitLabel: string;
    lowStockLevel: number;
    costPrice?: number | null;
    image?: string | null;
  }
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const valError = validateStockItem(data);
    if (valError) return { success: false, error: valError };

    await prisma.stockItem.update({
      where: { id },
      data: {
        name: sanitize(data.name),
        category: sanitize(data.category),
        unitLabel: sanitize(data.unitLabel),
        lowStockLevel: data.lowStockLevel,
        costPrice: data.costPrice && data.costPrice > 0 ? data.costPrice : null,
        image: data.image || null,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update item";
    return { success: false, error: message };
  }
}

export async function archiveStockItem(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.stockItem.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to archive item";
    return { success: false, error: message };
  }
}

// ─── Fetch Recent Stock Logs & Wastage ──────────────────

export async function getRecentStockLogs(limit = 40) {
  try {
    await requireSession();

    const logs = await prisma.stockLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        stockItem: { select: { name: true, category: true, unitLabel: true } },
        user: { select: { name: true } },
      },
    });

    return { success: true, data: logs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load logs";
    return { success: false, error: message };
  }
}

export async function getRecentWastage(limit = 40): Promise<ActionResult<WastageLogWithItem[]>> {
  try {
    await requireSession();

    const wastage = await prisma.wastageLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        stockItem: true,
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

    return { success: true, data: wastage as unknown as WastageLogWithItem[] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load wastage";
    return { success: false, error: message };
  }
}

