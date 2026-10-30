"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getManilaDateString, formatManilaDate, formatRecordedBy } from "@/lib/utils";
import { WASTAGE_REASON_LABELS } from "@/lib/constants";
import type {
  ActionResult,
  ReportsData,
  ReportDateRange,
  DailySalesBreakdown,
  SaleTransactionReportItem,
  ProductPerformance,
  FlavorPerformance,
  HourlySalesDistribution,
  WastageReportItem,
  WastageReasonBreakdown,
  StockUsageSuggestion,
  CashCountReportEntry,
} from "@/types";

export interface GetReportsOptions {
  startDate?: string;
  endDate?: string;
  rangeType?: ReportDateRange;
}

export async function getReportsData(
  options: GetReportsOptions = {}
): Promise<ActionResult<ReportsData>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const isAdmin = session.role === "ADMIN";
    const todayStr = getManilaDateString(); // "YYYY-MM-DD"

    let startDate = options.startDate;
    let endDate = options.endDate;
    const rangeType = options.rangeType || "7days";

    const todayDate = new Date(`${todayStr}T00:00:00+08:00`);

    if (rangeType === "today") {
      startDate = todayStr;
      endDate = todayStr;
    } else if (rangeType === "7days") {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - 6);
      startDate = getManilaDateString(d);
      endDate = todayStr;
    } else if (rangeType === "30days") {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - 29);
      startDate = getManilaDateString(d);
      endDate = todayStr;
    } else if (rangeType === "this_month") {
      const firstOfMonth = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        1
      );
      startDate = getManilaDateString(firstOfMonth);
      endDate = todayStr;
    } else {
      // custom fallback
      startDate = startDate || todayStr;
      endDate = endDate || todayStr;
    }

    // Ensure start <= end
    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    const startDateTime = new Date(`${startDate}T00:00:00+08:00`);
    const endDateTime = new Date(`${endDate}T23:59:59.999+08:00`);

    // Calculate days count
    const msDiff =
      new Date(`${endDate}T00:00:00+08:00`).getTime() -
      new Date(`${startDate}T00:00:00+08:00`).getTime();
    const daysCount = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24)) + 1);

    // Run parallel DB queries
    const [
      sales,
      wastageLogs,
      eodCounts,
      cashCounts,
      stockItems,
      menuProducts,
    ] = await Promise.all([
      // 1. Sales
      db.sale.findMany({
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          items: true,
          recordedBy: {
            select: { id: true, name: true, email: true, isActive: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      // 2. Wastage Logs
      db.wastageLog.findMany({
        where: {
          createdAt: {
            gte: startDateTime,
            lte: endDateTime,
          },
        },
        include: {
          stockItem: true,
          recordedBy: {
            select: { name: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      // 3. EOD Stock Counts
      db.endOfDayStockCount.findMany({
        where: {
          countDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          items: {
            include: {
              stockItem: true,
            },
          },
        },
      }),

      // 4. Daily Cash Counts (Only if Admin)
      isAdmin
        ? db.dailyCashCount.findMany({
            where: {
              countDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            include: {
              recordedBy: {
                select: { name: true },
              },
            },
            orderBy: {
              countDate: "desc",
            },
          })
        : Promise.resolve([]),

      // 5. Active Stock Items
      db.stockItem.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),

      // 6. Active Menu Products
      db.menuProduct.findMany({
        where: { isActive: true },
        select: { id: true, name: true, category: true },
      }),
    ]);

    // ─── 1. Aggregate Sales Summary & Daily Breakdown ──────
    let totalRevenue = 0;
    let cashSales = 0;
    let gcashSales = 0;
    let totalItemsSold = 0;

    const dailyMap: Record<
      string,
      {
        total: number;
        cash: number;
        gcash: number;
        orderCount: number;
        itemsSold: number;
      }
    > = {};

    // Initialize all dates in range with 0
    const cursor = new Date(startDateTime);
    while (cursor <= endDateTime) {
      const dStr = getManilaDateString(cursor);
      dailyMap[dStr] = {
        total: 0,
        cash: 0,
        gcash: 0,
        orderCount: 0,
        itemsSold: 0,
      };
      cursor.setDate(cursor.getDate() + 1);
    }

    const hourlyMap: Record<number, { count: number; revenue: number }> = {};
    for (let h = 8; h <= 21; h++) {
      hourlyMap[h] = { count: 0, revenue: 0 };
    }

    const productMap: Record<
      string,
      { name: string; category: string; quantity: number; revenue: number }
    > = {};

    // Pre-populate productMap from active products
    for (const prod of menuProducts) {
      productMap[prod.name] = {
        name: prod.name,
        category: prod.category,
        quantity: 0,
        revenue: 0,
      };
    }

    const flavorMap: Record<string, number> = {};

    for (const sale of sales) {
      totalRevenue += sale.totalAmount;
      if (sale.paymentMethod === "CASH") {
        cashSales += sale.totalAmount;
      } else {
        gcashSales += sale.totalAmount;
      }

      // Daily map
      if (dailyMap[sale.saleDate]) {
        dailyMap[sale.saleDate].total += sale.totalAmount;
        dailyMap[sale.saleDate].orderCount += 1;
        if (sale.paymentMethod === "CASH") {
          dailyMap[sale.saleDate].cash += sale.totalAmount;
        } else {
          dailyMap[sale.saleDate].gcash += sale.totalAmount;
        }
      }

      // Hour of day (in Manila timezone)
      const saleDateObj = new Date(sale.createdAt);
      const manilaHourStr = saleDateObj.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        hour12: false,
      });
      const hourNum = parseInt(manilaHourStr, 10);
      if (hourlyMap[hourNum]) {
        hourlyMap[hourNum].count += 1;
        hourlyMap[hourNum].revenue += sale.totalAmount;
      }

      // Items
      for (const item of sale.items) {
        totalItemsSold += item.quantity;
        if (dailyMap[sale.saleDate]) {
          dailyMap[sale.saleDate].itemsSold += item.quantity;
        }

        // Product performance
        if (!productMap[item.productName]) {
          productMap[item.productName] = {
            name: item.productName,
            category: "Other",
            quantity: 0,
            revenue: 0,
          };
        }
        productMap[item.productName].quantity += item.quantity;
        productMap[item.productName].revenue += item.subtotal;

        // Flavor performance (exclude standard/size labels)
        const vName = item.variantName.trim();
        if (
          vName &&
          !["Regular", "Standard", "Small", "Medium", "Large", "Solo", "Default"].includes(
            vName
          )
        ) {
          flavorMap[vName] = (flavorMap[vName] || 0) + item.quantity;
        }
      }
    }

    const totalOrders = sales.length;
    const averageOrderValue =
      totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;
    const cashPercentage =
      totalRevenue > 0 ? Math.round((cashSales / totalRevenue) * 1000) / 10 : 0;
    const gcashPercentage =
      totalRevenue > 0 ? Math.round((gcashSales / totalRevenue) * 1000) / 10 : 0;

    // Convert dailyMap to sorted array
    const dailySales: DailySalesBreakdown[] = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        displayDate: formatManilaDate(date),
        total: Math.round(d.total * 100) / 100,
        cash: Math.round(d.cash * 100) / 100,
        gcash: Math.round(d.gcash * 100) / 100,
        orderCount: d.orderCount,
        itemsSold: d.itemsSold,
      }));

    // Convert productMap to rankings
    const allProductList = Object.values(productMap);
    const topProducts: ProductPerformance[] = [...allProductList]
      .filter((p) => p.quantity > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .map((p) => ({
        name: p.name,
        category: p.category,
        quantitySold: p.quantity,
        revenue: Math.round(p.revenue * 100) / 100,
      }));

    const slowProducts: ProductPerformance[] = [...allProductList]
      .sort((a, b) => a.quantity - b.quantity || a.revenue - b.revenue)
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        category: p.category,
        quantitySold: p.quantity,
        revenue: Math.round(p.revenue * 100) / 100,
      }));

    const topFlavors: FlavorPerformance[] = Object.entries(flavorMap)
      .map(([flavor, quantitySold]) => ({ flavor, quantitySold }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // Hourly Distribution
    const peakHours: HourlySalesDistribution[] = Object.entries(hourlyMap).map(
      ([h, val]) => {
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayH = hour % 12 || 12;
        return {
          hour,
          hourLabel: `${displayH} ${ampm}`,
          salesCount: val.count,
          revenue: Math.round(val.revenue * 100) / 100,
        };
      }
    );

    // ─── 2. Wastage Aggregation ────────────────────────────
    let totalWastageQuantity = 0;
    let totalWastageCost = 0;
    const wastageByItemMap: Record<
      string,
      { itemName: string; unitLabel: string; quantity: number; cost: number }
    > = {};
    const wastageByReasonMap: Record<
      string,
      { count: number; quantity: number; cost: number }
    > = {};

    for (const log of wastageLogs) {
      totalWastageQuantity += log.quantity;
      const unitCost = log.stockItem?.costPrice || 0;
      const cost = log.quantity * unitCost;
      totalWastageCost += cost;

      // Item Map
      const itemId = log.stockItemId;
      if (!wastageByItemMap[itemId]) {
        wastageByItemMap[itemId] = {
          itemName: log.stockItem.name,
          unitLabel: log.stockItem.unitLabel,
          quantity: 0,
          cost: 0,
        };
      }
      wastageByItemMap[itemId].quantity += log.quantity;
      wastageByItemMap[itemId].cost += cost;

      // Reason Map
      const r = log.reason;
      if (!wastageByReasonMap[r]) {
        wastageByReasonMap[r] = { count: 0, quantity: 0, cost: 0 };
      }
      wastageByReasonMap[r].count += 1;
      wastageByReasonMap[r].quantity += log.quantity;
      wastageByReasonMap[r].cost += cost;
    }

    const wastageItems: WastageReportItem[] = Object.values(wastageByItemMap)
      .sort((a, b) => b.cost - a.cost || b.quantity - a.quantity)
      .map((w) => ({
        itemName: w.itemName,
        unitLabel: w.unitLabel,
        quantity: Math.round(w.quantity * 100) / 100,
        estimatedCost: Math.round(w.cost * 100) / 100,
      }));

    const wastageReasons: WastageReasonBreakdown[] = Object.entries(
      wastageByReasonMap
    )
      .map(([reason, val]) => ({
        reason,
        label: WASTAGE_REASON_LABELS[reason] || reason,
        count: val.count,
        quantity: Math.round(val.quantity * 100) / 100,
        estimatedCost: Math.round(val.cost * 100) / 100,
      }))
      .sort((a, b) => b.estimatedCost - a.estimatedCost);

    // ─── 3. Stock Usage & Restock Suggestions ──────────────
    // Calculate total usage from EOD counts
    const stockUsedMap: Record<string, number> = {};
    for (const eod of eodCounts) {
      for (const item of eod.items) {
        if (item.usedQty > 0) {
          stockUsedMap[item.stockItemId] =
            (stockUsedMap[item.stockItemId] || 0) + item.usedQty;
        }
      }
    }

    const stockSuggestions: StockUsageSuggestion[] = stockItems.map((item) => {
      const totalUsed = stockUsedMap[item.id] || 0;
      const avgDailyUsage = Math.round((totalUsed / daysCount) * 100) / 100;
      const daysRemaining =
        avgDailyUsage > 0
          ? Math.round((item.currentQuantity / avgDailyUsage) * 10) / 10
          : 99;

      // Suggested restock: ensure at least 7 days supply or up to min lowStockLevel
      const target7Days = Math.ceil(avgDailyUsage * 7);
      const neededForMin = Math.max(0, item.lowStockLevel * 2 - item.currentQuantity);
      const suggestedRestock = Math.max(0, Math.max(target7Days - item.currentQuantity, neededForMin));

      return {
        stockItemId: item.id,
        name: item.name,
        category: item.category,
        unitLabel: item.unitLabel,
        currentQuantity: item.currentQuantity,
        totalUsed: Math.round(totalUsed * 100) / 100,
        avgDailyUsage,
        daysRemaining,
        suggestedRestock,
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);

    // ─── 4. Cash Counts (Admin Only) ───────────────────────
    let cashCountsList: CashCountReportEntry[] | undefined = undefined;
    let cashCountSummary: ReportsData["cashCountSummary"] = undefined;

    if (isAdmin) {
      let totalShortage = 0;
      let totalOverage = 0;

      cashCountsList = cashCounts.map((c) => {
        if (c.difference < 0) totalShortage += Math.abs(c.difference);
        if (c.difference > 0) totalOverage += c.difference;

        return {
          id: c.id,
          countDate: c.countDate,
          startingCash: c.startingCash,
          cashSales: c.cashSales,
          expectedCash: c.expectedCash,
          countedCash: c.countedCash,
          difference: c.difference,
          isReopened: c.isReopened,
          notes: c.notes,
          recordedByName: c.recordedBy?.name || null,
          createdAt: c.createdAt.toISOString(),
        };
      });

      cashCountSummary = {
        totalShortage: Math.round(totalShortage * 100) / 100,
        totalOverage: Math.round(totalOverage * 100) / 100,
        netDifference: Math.round((totalOverage - totalShortage) * 100) / 100,
        countsCount: cashCounts.length,
      };
    }

    // ─── 5. Estimated Gross Profit (Admin Only) ────────────
    let estimatedGrossProfit: number | undefined = undefined;
    if (isAdmin) {
      // Stock cost of goods used
      let totalStockCost = 0;
      for (const item of stockItems) {
        if (item.costPrice && stockUsedMap[item.id]) {
          totalStockCost += stockUsedMap[item.id] * item.costPrice;
        }
      }
      estimatedGrossProfit = Math.round(
        (totalRevenue - totalWastageCost - totalStockCost) * 100
      ) / 100;
    }

    // Individual sales transactions with "Recorded by"
    const salesTransactions: SaleTransactionReportItem[] = sales.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      saleDate: s.saleDate,
      paymentMethod: s.paymentMethod === "CASH" ? "Cash" : "E-Wallet",
      totalAmount: s.totalAmount,
      itemsCount: s.items.reduce((sum, it) => sum + it.quantity, 0),
      itemsSummary: s.items
        .map((it) => `${it.quantity}x ${it.productName} (${it.variantName})`)
        .join("; "),
      recordedBy: formatRecordedBy(s.recordedBy),
      notes: s.notes,
    }));

    return {
      success: true,
      data: {
        startDate,
        endDate,
        daysCount,
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          cashSales: Math.round(cashSales * 100) / 100,
          gcashSales: Math.round(gcashSales * 100) / 100,
          cashPercentage,
          gcashPercentage,
          totalOrders,
          totalItemsSold,
          averageOrderValue,
          totalWastageCost: Math.round(totalWastageCost * 100) / 100,
          totalWastageQuantity: Math.round(totalWastageQuantity * 100) / 100,
          estimatedGrossProfit,
        },
        dailySales,
        salesTransactions,
        topProducts,
        slowProducts,
        topFlavors,
        peakHours,
        wastageReasons,
        wastageItems,
        stockSuggestions,
        cashCounts: cashCountsList,
        cashCountSummary,
      },
    };
  } catch (error) {
    console.error("getReportsData error:", error);
    return { success: false, error: "Failed to load reports" };
  }
}

