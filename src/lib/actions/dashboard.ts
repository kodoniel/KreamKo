"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getManilaDateString } from "@/lib/utils";
import type { DashboardStats, ActionResult } from "@/types";

/**
 * Fetch consolidated dashboard metrics for today and past 7 days.
 * All date calculations use Asia/Manila (+08:00).
 */
export async function getDashboardData(): Promise<ActionResult<DashboardStats>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const todayStr = getManilaDateString(); // "YYYY-MM-DD"
    const startOfToday = new Date(`${todayStr}T00:00:00+08:00`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999+08:00`);

    // Generate list of 7 Manila date strings (from 6 days ago up to today)
    const last7DaysInfo: { dateStr: string; dayLabel: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - i);
      const dateStr = getManilaDateString(d);

      let dayLabel = d.toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        weekday: "short",
      });
      if (i === 0) dayLabel = "Today";
      else if (i === 1) dayLabel = "Yest";

      last7DaysInfo.push({ dateStr, dayLabel });
    }
    const last7DateStrings = last7DaysInfo.map((d) => d.dateStr);

    // Parallel fetch: Sales today, Sales 7 days, Wastage today, EOD Stock today, Cash Count today, Low stock items
    const [
      todaySalesList,
      last7DaysSalesList,
      todayWastageLogs,
      todayEODCount,
      todayCashCount,
      activeStockItems,
    ] = await Promise.all([
      // 1. Today's sales with items
      db.sale.findMany({
        where: {
          saleDate: todayStr,
        },
        include: {
          items: true,
        },
      }),

      // 2. Last 7 days sales for trend chart
      db.sale.findMany({
        where: {
          saleDate: {
            in: last7DateStrings,
          },
        },
        select: {
          saleDate: true,
          totalAmount: true,
          paymentMethod: true,
        },
      }),

      // 3. Today's wastage
      db.wastageLog.findMany({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        include: {
          stockItem: true,
        },
      }),

      // 4. Today's EOD stock count
      db.endOfDayStockCount.findUnique({
        where: {
          countDate: todayStr,
        },
      }),

      // 5. Today's cash count
      db.dailyCashCount.findUnique({
        where: {
          countDate: todayStr,
        },
      }),

      // 6. Active stock items
      db.stockItem.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // ─── Calculate Today's Sales Metrics ───────────────────
    let todaySales = 0;
    let cashSales = 0;
    let gcashSales = 0;
    let itemsSold = 0;
    const productQuantities: Record<string, number> = {};
    const flavorQuantities: Record<string, number> = {};

    for (const sale of todaySalesList) {
      todaySales += sale.totalAmount;
      if (sale.paymentMethod === "CASH") {
        cashSales += sale.totalAmount;
      } else {
        gcashSales += sale.totalAmount;
      }

      for (const item of sale.items) {
        itemsSold += item.quantity;

        // Group products
        productQuantities[item.productName] =
          (productQuantities[item.productName] || 0) + item.quantity;

        // Group flavors / variants (exclude generic 'Regular')
        const variantClean = item.variantName.trim();
        if (
          variantClean &&
          !["Regular", "Standard", "Default"].includes(variantClean)
        ) {
          flavorQuantities[variantClean] =
            (flavorQuantities[variantClean] || 0) + item.quantity;
        }
      }
    }

    // Determine top product
    let bestProduct: string | null = null;
    let maxProdQty = 0;
    for (const [prod, qty] of Object.entries(productQuantities)) {
      if (qty > maxProdQty) {
        maxProdQty = qty;
        bestProduct = `${prod} (${qty})`;
      }
    }

    // Determine top flavor
    let bestFlavor: string | null = null;
    let maxFlavorQty = 0;
    for (const [flavor, qty] of Object.entries(flavorQuantities)) {
      if (qty > maxFlavorQty) {
        maxFlavorQty = qty;
        bestFlavor = `${flavor} (${qty})`;
      }
    }

    // ─── Low Stock Alerts ─────────────────────────────────
    const lowStockItems = activeStockItems
      .filter((item) => item.currentQuantity <= item.lowStockLevel)
      .sort((a, b) => {
        // Critical / out of stock first
        const aCrit = a.currentQuantity <= 0 ? 0 : a.currentQuantity <= a.lowStockLevel * 0.5 ? 1 : 2;
        const bCrit = b.currentQuantity <= 0 ? 0 : b.currentQuantity <= b.lowStockLevel * 0.5 ? 1 : 2;
        if (aCrit !== bCrit) return aCrit - bCrit;
        return a.currentQuantity - b.currentQuantity;
      });

    // ─── Wastage Metrics ──────────────────────────────────
    let todayWastageCount = 0;
    let todayWastageCost = 0;
    for (const log of todayWastageLogs) {
      todayWastageCount += log.quantity;
      if (log.stockItem?.costPrice) {
        todayWastageCost += log.quantity * log.stockItem.costPrice;
      }
    }

    // ─── 7-Day Sales Trend ────────────────────────────────
    const last7DaysSales: DashboardStats["last7DaysSales"] = last7DaysInfo.map(
      ({ dateStr, dayLabel }) => {
        const daySales = last7DaysSalesList.filter((s) => s.saleDate === dateStr);
        const dayTotal = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
        const dayCash = daySales
          .filter((s) => s.paymentMethod === "CASH")
          .reduce((acc, s) => acc + s.totalAmount, 0);
        const dayGCash = daySales
          .filter((s) => s.paymentMethod === "GCASH")
          .reduce((acc, s) => acc + s.totalAmount, 0);

        return {
          date: dateStr,
          dayLabel,
          total: Math.round(dayTotal * 100) / 100,
          cash: Math.round(dayCash * 100) / 100,
          gcash: Math.round(dayGCash * 100) / 100,
        };
      }
    );

    return {
      success: true,
      data: {
        todaySales: Math.round(todaySales * 100) / 100,
        cashSales: Math.round(cashSales * 100) / 100,
        gcashSales: Math.round(gcashSales * 100) / 100,
        itemsSold,
        transactionCount: todaySalesList.length,
        bestProduct,
        bestFlavor,
        lowStockItems,
        todayWastageCount: Math.round(todayWastageCount * 100) / 100,
        todayWastageCost: Math.round(todayWastageCost * 100) / 100,
        eodStockCountDone: !!todayEODCount,
        eodCashCountDone: !!todayCashCount && !todayCashCount.isReopened,
        eodCashCountDetails: todayCashCount
          ? {
              expectedCash: todayCashCount.expectedCash,
              countedCash: todayCashCount.countedCash,
              difference: todayCashCount.difference,
            }
          : null,
        last7DaysSales,
      },
    };
  } catch (error) {
    console.error("getDashboardData failed:", error);
    return { success: false, error: "Failed to load dashboard data" };
  }
}
