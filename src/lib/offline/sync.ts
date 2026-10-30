/**
 * Offline Sync Engine for Kream Ko
 *
 * Automatically queues changes in Dexie (IndexedDB) when offline
 * and syncs them idempotently to PostgreSQL via Server Actions
 * once internet connection returns.
 */

import { offlineDB } from "./db";
import { recordSale } from "@/lib/actions/sales";
import {
  adjustStock,
  logWastage,
  saveEndOfDayStockCount,
} from "@/lib/actions/inventory";
import { saveDailyCashCount } from "@/lib/actions/sales";
import type {
  PendingSale,
  PendingStockChange,
  PendingWastage,
  PendingEODStockCount,
  PendingCashCount,
  MenuProductWithVariants,
} from "@/types";
import type { StockItem } from "@prisma/client";

// Custom event name for sync status updates
export const SYNC_STATUS_EVENT = "kreamko:sync-status";

export function emitSyncEvent(detail: {
  isSyncing: boolean;
  pendingCount: number;
}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail }));
  }
}

// ─── Cache Helpers ──────────────────────────────────────

export async function cacheMenuProducts(products: MenuProductWithVariants[]) {
  if (!offlineDB) return;
  await offlineDB.cachedMenuProducts.clear();
  await offlineDB.cachedMenuProducts.bulkPut(products);
}

export async function getCachedMenuProducts(): Promise<MenuProductWithVariants[]> {
  if (!offlineDB) return [];
  return offlineDB.cachedMenuProducts.toArray();
}

export async function cacheStockItems(items: StockItem[]) {
  if (!offlineDB) return;
  await offlineDB.cachedStockItems.clear();
  await offlineDB.cachedStockItems.bulkPut(items);
}

export async function getCachedStockItems(): Promise<StockItem[]> {
  if (!offlineDB) return [];
  return offlineDB.cachedStockItems.toArray();
}

// ─── Pending Count Helper ───────────────────────────────

export async function getPendingItemsCount(): Promise<number> {
  if (!offlineDB) return 0;
  try {
    const [sales, stock, wastage, eod, cash] = await Promise.all([
      offlineDB.pendingSales.filter((s) => !s.synced).count(),
      offlineDB.pendingStockChanges.filter((s) => !s.synced).count(),
      offlineDB.pendingWastage.filter((w) => !w.synced).count(),
      offlineDB.pendingEODStockCounts.filter((c) => !c.synced).count(),
      offlineDB.pendingCashCounts.filter((c) => !c.synced).count(),
    ]);
    return sales + stock + wastage + eod + cash;
  } catch {
    return 0;
  }
}

// ─── Offline Queue Writers ──────────────────────────────

export async function queueSaleOffline(sale: PendingSale) {
  if (!offlineDB) return;
  await offlineDB.pendingSales.put({ ...sale, synced: false });
  const count = await getPendingItemsCount();
  emitSyncEvent({ isSyncing: false, pendingCount: count });
}

export async function queueStockChangeOffline(change: PendingStockChange) {
  if (!offlineDB) return;
  await offlineDB.pendingStockChanges.put({ ...change, synced: false });

  // Optimistically update cached stock quantity
  const cached = await offlineDB.cachedStockItems.get(change.stockItemId);
  if (cached) {
    const newQty = Math.max(0, Math.round((cached.currentQuantity + change.changeDelta) * 100) / 100);
    await offlineDB.cachedStockItems.update(change.stockItemId, {
      currentQuantity: newQty,
    });
  }

  const count = await getPendingItemsCount();
  emitSyncEvent({ isSyncing: false, pendingCount: count });
}

export async function queueWastageOffline(wastage: PendingWastage) {
  if (!offlineDB) return;
  await offlineDB.pendingWastage.put({ ...wastage, synced: false });

  // Optimistically reduce cached stock
  const cached = await offlineDB.cachedStockItems.get(wastage.stockItemId);
  if (cached) {
    const newQty = Math.max(0, Math.round((cached.currentQuantity - wastage.quantity) * 100) / 100);
    await offlineDB.cachedStockItems.update(wastage.stockItemId, {
      currentQuantity: newQty,
    });
  }

  const count = await getPendingItemsCount();
  emitSyncEvent({ isSyncing: false, pendingCount: count });
}

export async function queueEODStockCountOffline(count: PendingEODStockCount) {
  if (!offlineDB) return;
  await offlineDB.pendingEODStockCounts.put({ ...count, synced: false });

  // Optimistically update cached stock items
  for (const item of count.items) {
    await offlineDB.cachedStockItems.update(item.stockItemId, {
      currentQuantity: item.remainingQty,
    });
  }

  const pending = await getPendingItemsCount();
  emitSyncEvent({ isSyncing: false, pendingCount: pending });
}

export async function queueCashCountOffline(count: PendingCashCount) {
  if (!offlineDB) return;
  await offlineDB.pendingCashCounts.put({ ...count, synced: false });
  const pending = await getPendingItemsCount();
  emitSyncEvent({ isSyncing: false, pendingCount: pending });
}

// ─── Main Synchronizer ──────────────────────────────────

let isSyncInProgress = false;

export async function syncAllPendingQueue(): Promise<{
  success: boolean;
  syncedCount: number;
}> {
  if (!offlineDB || isSyncInProgress) {
    return { success: false, syncedCount: 0 };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { success: false, syncedCount: 0 };
  }

  isSyncInProgress = true;
  let syncedCount = 0;

  try {
    const pendingTotal = await getPendingItemsCount();
    if (pendingTotal === 0) {
      isSyncInProgress = false;
      emitSyncEvent({ isSyncing: false, pendingCount: 0 });
      return { success: true, syncedCount: 0 };
    }

    emitSyncEvent({ isSyncing: true, pendingCount: pendingTotal });

    // 1. Sync Pending Sales
    const pendingSales = await offlineDB.pendingSales
      .filter((s) => !s.synced)
      .toArray();

    for (const sale of pendingSales) {
      try {
        const res = await recordSale({
          id: sale.id,
          paymentMethod: sale.paymentMethod,
          notes: sale.notes,
          saleDate: sale.saleDate,
          items: sale.items,
          recordedById: sale.recordedById,
        });

        if (res.success) {
          await offlineDB.pendingSales.delete(sale.id);
          syncedCount++;
        }
      } catch (err) {
        console.warn("Sale sync error for", sale.id, err);
      }
    }

    // 2. Sync Pending Stock Changes (Deltas!)
    const pendingStock = await offlineDB.pendingStockChanges
      .filter((s) => !s.synced)
      .toArray();

    for (const stock of pendingStock) {
      try {
        const res = await adjustStock({
          stockItemId: stock.stockItemId,
          changeDelta: stock.changeDelta,
          reason: stock.reason,
          notes: stock.notes,
          clientLogId: stock.id,
        });

        if (res.success) {
          await offlineDB.pendingStockChanges.delete(stock.id);
          syncedCount++;
        }
      } catch (err) {
        console.warn("Stock sync error for", stock.id, err);
      }
    }

    // 3. Sync Pending Wastage
    const pendingWastage = await offlineDB.pendingWastage
      .filter((w) => !w.synced)
      .toArray();

    for (const wastage of pendingWastage) {
      try {
        const res = await logWastage({
          stockItemId: wastage.stockItemId,
          quantity: wastage.quantity,
          reason: wastage.reason,
          notes: wastage.notes,
          clientWastageId: wastage.id,
        });

        if (res.success) {
          await offlineDB.pendingWastage.delete(wastage.id);
          syncedCount++;
        }
      } catch (err) {
        console.warn("Wastage sync error for", wastage.id, err);
      }
    }

    // 4. Sync Pending EOD Stock Counts
    const pendingEOD = await offlineDB.pendingEODStockCounts
      .filter((c) => !c.synced)
      .toArray();

    for (const eod of pendingEOD) {
      try {
        const res = await saveEndOfDayStockCount({
          countDate: eod.countDate,
          items: eod.items,
          notes: eod.notes,
          clientCountId: eod.id,
        });

        if (res.success) {
          await offlineDB.pendingEODStockCounts.delete(eod.id);
          syncedCount++;
        }
      } catch (err) {
        console.warn("EOD count sync error for", eod.id, err);
      }
    }

    // 5. Sync Pending Cash Counts
    const pendingCash = await offlineDB.pendingCashCounts
      .filter((c) => !c.synced)
      .toArray();

    for (const cash of pendingCash) {
      try {
        const res = await saveDailyCashCount({
          countDate: cash.countDate,
          startingCash: cash.startingCash,
          countedCash: cash.countedCash,
          notes: cash.notes,
          clientCountId: cash.id,
        });

        if (res.success) {
          await offlineDB.pendingCashCounts.delete(cash.id);
          syncedCount++;
        }
      } catch (err) {
        console.warn("Cash count sync error for", cash.id, err);
      }
    }

    const remaining = await getPendingItemsCount();
    emitSyncEvent({ isSyncing: false, pendingCount: remaining });

    return { success: true, syncedCount };
  } catch (error) {
    console.error("Sync queue failed:", error);
    const count = await getPendingItemsCount();
    emitSyncEvent({ isSyncing: false, pendingCount: count });
    return { success: false, syncedCount };
  } finally {
    isSyncInProgress = false;
  }
}

