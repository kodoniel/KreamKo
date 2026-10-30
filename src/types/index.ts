/**
 * Shared TypeScript types for Kream Ko
 *
 * These supplement the Prisma-generated types with
 * app-specific shapes used across client and server.
 */

import type {
  Sale,
  SaleItem,
  StockItem,
  StockLog,
  MenuProduct,
  MenuVariant,
  WastageLog,
  EndOfDayStockCount,
  EndOfDayStockCountItem,
  DailyCashCount,
  User,
} from "@prisma/client";

// ─── User & Auth ────────────────────────────────────────

/** The session payload stored in the JWT cookie */
export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF";
  expiresAt: string; // ISO date string
};

/** User info exposed to the client (no password hash) */
export type SafeUser = Omit<User, "passwordHash">;

// ─── Menu ───────────────────────────────────────────────

/** A product with its variants included */
export type MenuProductWithVariants = MenuProduct & {
  variants: MenuVariant[];
};

// ─── Sales ──────────────────────────────────────────────

/** A sale with its line items included */
export type SaleWithItems = Sale & {
  items: SaleItem[];
  recordedBy?: SafeUser | null;
};

/** Shape of an add-on/dip stored in SaleItem.addOns JSON */
export type SaleAddOn = {
  name: string;
  price: number;
  quantity: number;
};

/** Offline sale before sync */
export type PendingSale = {
  id: string; // client-generated UUID
  paymentMethod: "CASH" | "GCASH";
  totalAmount: number;
  saleDate: string;
  notes?: string;
  recordedById?: string;
  items: PendingSaleItem[];
  createdAt: string; // ISO string
  synced: boolean;
};

export type PendingSaleItem = {
  productId?: string;
  variantId?: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addOns?: SaleAddOn[];
};

// ─── Stock ──────────────────────────────────────────────

/** Stock item with latest logs */
export type StockItemWithLogs = StockItem & {
  stockLogs: StockLog[];
};

/** Offline stock change before sync */
export type PendingStockChange = {
  id: string; // client UUID
  stockItemId: string;
  changeDelta: number;
  reason: "RESTOCK" | "DAMAGE" | "ADJUSTMENT" | "MANUAL_COUNT" | "END_OF_DAY_COUNT" | "WASTAGE";
  costPrice?: number;
  notes?: string;
  createdAt: string;
  synced: boolean;
};

// ─── Wastage ────────────────────────────────────────────

/** Offline wastage entry before sync */
export type PendingWastage = {
  id: string; // client UUID
  stockItemId: string;
  quantity: number;
  reason: "SPOILED" | "SPILLED" | "DROPPED" | "EXPIRED" | "OTHER";
  notes?: string;
  createdAt: string;
  synced: boolean;
};

/** Wastage log with related stock item info */
export type WastageLogWithItem = WastageLog & {
  stockItem: StockItem;
  recordedBy?: SafeUser | null;
};

// ─── End-of-Day Stock Count ─────────────────────────────

export type EODStockCountWithItems = EndOfDayStockCount & {
  items: (EndOfDayStockCountItem & {
    stockItem: StockItem;
  })[];
  recordedBy?: SafeUser | null;
};

/** Offline EOD stock count before sync */
export type PendingEODStockCount = {
  id: string;
  countDate: string;
  items: {
    stockItemId: string;
    remainingQty: number;
  }[];
  notes?: string;
  createdAt: string;
  synced: boolean;
};

// ─── Daily Cash Count ───────────────────────────────────

/** Offline cash count before sync */
export type PendingCashCount = {
  id: string;
  countDate: string;
  startingCash: number;
  countedCash: number;
  notes?: string;
  createdAt: string;
  synced: boolean;
};

export type DailyCashCountWithUser = DailyCashCount & {
  recordedBy?: SafeUser | null;
};

// ─── Dashboard ──────────────────────────────────────────

export type DashboardStats = {
  todaySales: number;
  cashSales: number;
  gcashSales: number;
  itemsSold: number;
  transactionCount: number;
  bestProduct: string | null;
  bestFlavor: string | null;
  lowStockItems: StockItem[];
  todayWastageCount: number;
  todayWastageCost: number;
  eodStockCountDone: boolean;
  eodCashCountDone: boolean;
  eodCashCountDetails?: {
    expectedCash: number;
    countedCash: number;
    difference: number;
  } | null;
  last7DaysSales: {
    date: string;
    dayLabel: string;
    total: number;
    cash: number;
    gcash: number;
  }[];
};

// ─── Reports ──────────────────────────────────────────

export type ReportDateRange = "today" | "7days" | "30days" | "this_month" | "custom";

export type DailySalesBreakdown = {
  date: string;
  displayDate: string;
  total: number;
  cash: number;
  gcash: number;
  orderCount: number;
  itemsSold: number;
};

export type ProductPerformance = {
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
};

export type FlavorPerformance = {
  flavor: string;
  quantitySold: number;
};

export type HourlySalesDistribution = {
  hour: number;
  hourLabel: string;
  salesCount: number;
  revenue: number;
};

export type WastageReportItem = {
  itemName: string;
  unitLabel: string;
  quantity: number;
  estimatedCost: number;
};

export type WastageReasonBreakdown = {
  reason: string;
  label: string;
  count: number;
  quantity: number;
  estimatedCost: number;
};

export type StockUsageSuggestion = {
  stockItemId: string;
  name: string;
  category: string;
  unitLabel: string;
  currentQuantity: number;
  totalUsed: number;
  avgDailyUsage: number;
  daysRemaining: number;
  suggestedRestock: number;
};

export type CashCountReportEntry = {
  id: string;
  countDate: string;
  startingCash: number;
  cashSales: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
  isReopened: boolean;
  notes?: string | null;
  recordedByName?: string | null;
  createdAt: string;
};

export type SaleTransactionReportItem = {
  id: string;
  createdAt: string;
  saleDate: string;
  paymentMethod: "CASH" | "GCASH" | "Cash" | "E-Wallet" | string;
  totalAmount: number;
  itemsCount: number;
  itemsSummary: string;
  recordedBy: string;
  notes?: string | null;
};

export type ReportsData = {
  startDate: string;
  endDate: string;
  daysCount: number;
  summary: {
    totalRevenue: number;
    cashSales: number;
    gcashSales: number;
    cashPercentage: number;
    gcashPercentage: number;
    totalOrders: number;
    totalItemsSold: number;
    averageOrderValue: number;
    totalWastageCost: number;
    totalWastageQuantity: number;
    estimatedGrossProfit?: number; // Admin only
  };
  dailySales: DailySalesBreakdown[];
  salesTransactions?: SaleTransactionReportItem[];
  topProducts: ProductPerformance[];
  slowProducts: ProductPerformance[];
  topFlavors: FlavorPerformance[];
  peakHours: HourlySalesDistribution[];
  wastageReasons: WastageReasonBreakdown[];
  wastageItems: WastageReportItem[];
  stockSuggestions: StockUsageSuggestion[];
  cashCounts?: CashCountReportEntry[]; // Admin only
  cashCountSummary?: {
    totalShortage: number;
    totalOverage: number;
    netDifference: number;
    countsCount: number;
  }; // Admin only
};

// ─── Shopping List ──────────────────────────────────────

export type ShoppingListItem = {
  id: string;
  name: string;
  category: string;
  unitLabel: string;
  currentQuantity: number;
  lowStockLevel: number;
  suggestedBuy: number;
  checked: boolean;
};

// ─── API Response ───────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

