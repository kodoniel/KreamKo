"use client";

import Link from "next/link";
import { CopySummaryButton } from "./CopySummaryButton";
import { SalesTrendChart } from "./SalesTrendChart";
import { formatPeso, formatManilaDate } from "@/lib/utils";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
  Package,
  Sparkles,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Store,
} from "lucide-react";
import type { DashboardStats, SessionPayload } from "@/types";

interface DashboardClientProps {
  stats: DashboardStats;
  user: SessionPayload;
}

export function DashboardClient({ stats, user }: DashboardClientProps) {
  const todayStr = formatManilaDate(new Date());

  const averageOrderValue =
    stats.transactionCount > 0
      ? Math.round((stats.todaySales / stats.transactionCount) * 100) / 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD6DE]/70 text-[#b82e46] text-xs font-bold mb-1.5">
            <Store className="w-3.5 h-3.5" />
            <span>Kream Ko Stall</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 tracking-tight">
            Hello, {user.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Today is <strong className="text-gray-700">{todayStr}</strong>. Here is your stall overview.
          </p>
        </div>

        {/* Top Actions: Copy Summary Button & Sales shortcut */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <CopySummaryButton stats={stats} />
          <Link
            href="/sales"
            className="py-2.5 px-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-[#FFB5C2]" />
            <span>Open Counter</span>
          </Link>
        </div>
      </div>

      {/* 4-Stat Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Total Sales */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#C8F0DE] text-emerald-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-gray-900">
              {formatPeso(stats.todaySales)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C8F0DE]/70 text-emerald-950">
                Cash: {formatPeso(stats.cashSales)}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-950">
                E-Wallet: {formatPeso(stats.gcashSales)}
              </span>
            </div>
          </div>
        </div>

        {/* Stat 2: Orders & Units */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Orders & Items
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFD6DE] text-[#b82e46] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-gray-900">
              {stats.transactionCount}{" "}
              <span className="text-xs font-semibold text-gray-500">orders</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1 font-medium">
              <strong className="text-gray-800">{stats.itemsSold}</strong> items sold (avg{" "}
              {formatPeso(averageOrderValue)}/order)
            </div>
          </div>
        </div>

        {/* Stat 3: Best Sellers */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Top Sellers
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFECC4] text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500 truncate">
              Product:{" "}
              <strong className="text-gray-900 font-bold">
                {stats.bestProduct || "None yet"}
              </strong>
            </div>
            <div className="text-xs text-gray-500 truncate">
              Flavor:{" "}
              <strong className="text-[#b82e46] font-bold">
                {stats.bestFlavor || "None yet"}
              </strong>
            </div>
          </div>
        </div>

        {/* Stat 4: Wastage Today */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Wastage Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-gray-900">
              {stats.todayWastageCount}{" "}
              <span className="text-xs font-semibold text-gray-500">packs/items</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1 font-medium">
              {stats.todayWastageCost > 0
                ? `~${formatPeso(stats.todayWastageCost)} estimated loss`
                : "No reported waste today"}
            </div>
          </div>
        </div>
      </div>

      {/* Closing Checklist / End-of-Day Reminders */}
      <div className="p-5 rounded-3xl bg-[#FFFDF9] border border-[#FFE0A3] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-bold text-gray-900">
              Closing Checklist (End of Day)
            </h3>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            Daily stall routine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* EOD Stock Count Item */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
              stats.eodStockCountDone
                ? "bg-[#C8F0DE]/40 border-[#A8E6CF]"
                : "bg-white border-[#E5E1DC]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {stats.eodStockCountDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  End-of-Day Stock Count
                </span>
                <span className="text-[11px] text-gray-500">
                  {stats.eodStockCountDone
                    ? "Recorded for today"
                    : "Not yet completed for today"}
                </span>
              </div>
            </div>

            <Link
              href="/inventory"
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                stats.eodStockCountDone
                  ? "bg-white text-gray-600 border border-[#E5E1DC] hover:bg-gray-50"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {stats.eodStockCountDone ? "Review" : "Count Now"}
            </Link>
          </div>

          {/* Daily Cash Count Item */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
              stats.eodCashCountDone
                ? "bg-[#C8F0DE]/40 border-[#A8E6CF]"
                : "bg-white border-[#E5E1DC]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {stats.eodCashCountDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Daily Cash Drawer Count
                </span>
                <span className="text-[11px] text-gray-500">
                  {stats.eodCashCountDone && stats.eodCashCountDetails ? (
                    stats.eodCashCountDetails.difference === 0 ? (
                      <span className="text-emerald-700 font-semibold">
                        Drawer balanced perfectly
                      </span>
                    ) : stats.eodCashCountDetails.difference > 0 ? (
                      <span className="text-sky-700 font-semibold">
                        +{formatPeso(stats.eodCashCountDetails.difference)} Over
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold">
                        {formatPeso(stats.eodCashCountDetails.difference)} Short
                      </span>
                    )
                  ) : (
                    "Count drawer cash at closing"
                  )}
                </span>
              </div>
            </div>

            <Link
              href="/sales"
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                stats.eodCashCountDone
                  ? "bg-white text-gray-600 border border-[#E5E1DC] hover:bg-gray-50"
                  : "bg-amber-600 text-white hover:bg-amber-700"
              }`}
            >
              {stats.eodCashCountDone ? "Review" : "Count Cash"}
            </Link>
          </div>
        </div>
      </div>

      {/* 2-Column Section: 7-Day Trend Chart & Low-Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 7-Day Sales Trend (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <SalesTrendChart data={stats.last7DaysSales} />

          {/* Quick Links Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              href="/sales"
              className="p-3.5 rounded-2xl bg-white border border-[#E5E1DC] hover:border-[#FFB5C2] shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-gray-900 group-hover:text-[#b82e46] transition-colors block">
                  Counter Sales
                </span>
                <span className="text-[10px] text-gray-400">Order taking</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#b82e46] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/inventory"
              className="p-3.5 rounded-2xl bg-white border border-[#E5E1DC] hover:border-[#FFE0A3] shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-gray-900 group-hover:text-amber-800 transition-colors block">
                  Stock Packs
                </span>
                <span className="text-[10px] text-gray-400">Inventory & logs</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-800 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/reports"
              className="p-3.5 rounded-2xl bg-white border border-[#E5E1DC] hover:border-[#A8E6CF] shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group col-span-2 sm:col-span-1"
            >
              <div>
                <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 transition-colors block">
                  Sales Reports
                </span>
                <span className="text-[10px] text-gray-400">Trends & breakdown</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        {/* Right: Low-Stock Alerts Widget (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-gray-900">
                Low Stock Alerts
              </h3>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-bold text-[#b82e46] hover:underline flex items-center gap-1"
            >
              <span>What to buy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.lowStockItems.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#C8F0DE]/30 border border-[#A8E6CF]/60 text-center">
              <Sparkles className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-950">
                All items well-stocked!
              </p>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">
                No items are currently below their low-stock threshold.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {stats.lowStockItems.map((item) => {
                const isOutOfStock = item.currentQuantity <= 0;
                const isCritical =
                  !isOutOfStock &&
                  item.currentQuantity <= Math.max(1, item.lowStockLevel * 0.5);

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                      isOutOfStock
                        ? "bg-[#FFD6DE]/30 border-[#FFB5C2]"
                        : isCritical
                        ? "bg-[#FFF8F0] border-[#FFB5C2]"
                        : "bg-[#FFFDF9] border-[#FFE0A3]"
                    }`}
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-white/80 px-1.5 py-0.2 rounded-md">
                          {item.category}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-[#c73e57] text-white">
                            Out of stock
                          </span>
                        ) : isCritical ? (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-[#FFD6DE] text-[#b82e46]">
                            Critical
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-[#FFECC4] text-amber-900">
                            Low
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 truncate block">
                        {item.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-display font-extrabold text-sm block ${
                          isOutOfStock
                            ? "text-[#c73e57]"
                            : isCritical
                            ? "text-[#b82e46]"
                            : "text-amber-900"
                        }`}
                      >
                        {item.currentQuantity} {item.unitLabel}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Min: {item.lowStockLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

