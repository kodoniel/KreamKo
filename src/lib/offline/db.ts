/**
 * IndexedDB Database for Offline Storage (Dexie.js)
 *
 * Caches menu & stock items for instant offline browsing.
 * Stores pending sales, stock adjustments, wastage logs,
 * and EOD counts with client UUIDs for idempotent syncing.
 */

import Dexie, { type Table } from "dexie";
import type {
  PendingSale,
  PendingStockChange,
  PendingWastage,
  PendingEODStockCount,
  PendingCashCount,
  MenuProductWithVariants,
} from "@/types";
import type { StockItem } from "@prisma/client";

export class KreamKoOfflineDB extends Dexie {
  cachedMenuProducts!: Table<MenuProductWithVariants, string>;
  cachedStockItems!: Table<StockItem, string>;
  pendingSales!: Table<PendingSale, string>;
  pendingStockChanges!: Table<PendingStockChange, string>;
  pendingWastage!: Table<PendingWastage, string>;
  pendingEODStockCounts!: Table<PendingEODStockCount, string>;
  pendingCashCounts!: Table<PendingCashCount, string>;

  constructor() {
    super("kreamko_offline_db");

    this.version(1).stores({
      cachedMenuProducts: "id, category, sortOrder",
      cachedStockItems: "id, category, name, currentQuantity",
      pendingSales: "id, saleDate, synced, createdAt",
      pendingStockChanges: "id, stockItemId, synced, createdAt",
      pendingWastage: "id, stockItemId, synced, createdAt",
      pendingEODStockCounts: "id, countDate, synced, createdAt",
      pendingCashCounts: "id, countDate, synced, createdAt",
    });
  }
}

// Client-only singleton
export const offlineDB =
  typeof window !== "undefined"
    ? new KreamKoOfflineDB()
    : (null as unknown as KreamKoOfflineDB);

