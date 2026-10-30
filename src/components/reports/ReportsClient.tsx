"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { getReportsData, type GetReportsOptions } from "@/lib/actions/reports";
import { downloadCsv } from "@/lib/csvExport";
import { formatPeso, formatManilaDate, formatManilaDateTime } from "@/lib/utils";
import {
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Trash2,
  Clock,
  Layers,
  Shield,
  FileSpreadsheet,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  ChevronDown,
} from "lucide-react";
import type { ReportsData, ReportDateRange } from "@/types";

interface ReportsClientProps {
  initialData: ReportsData;
  isAdmin: boolean;
}

export function ReportsClient({ initialData, isAdmin }: ReportsClientProps) {
  const [data, setData] = useState<ReportsData>(initialData);
  const [rangeType, setRangeType] = useState<ReportDateRange>("7days");
  const [customStart, setCustomStart] = useState(initialData.startDate);
  const [customEnd, setCustomEnd] = useState(initialData.endDate);
  const [activeTab, setActiveTab] = useState<
    "sales" | "products" | "stock" | "cash" | "profit"
  >("sales");

  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isPending, startTransition] = useTransition();

  const handleRangeChange = (type: ReportDateRange) => {
    setRangeType(type);
    if (type !== "custom") {
      startTransition(async () => {
        const res = await getReportsData({ rangeType: type });
        if (res.success) {
          setData(res.data);
        }
      });
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await getReportsData({
        rangeType: "custom",
        startDate: customStart,
        endDate: customEnd,
      });
      if (res.success) {
        setData(res.data);
      }
    });
  };

  // CSV Exports
  const handleExportDailySales = () => {
    const headers = [
      "Date",
      "Total Sales (PHP)",
      "Cash Sales (PHP)",
      "E-Wallet Sales (PHP)",
      "Orders Count",
      "Items Sold",
    ];
    const rows = data.dailySales.map((d) => [
      d.date,
      d.total,
      d.cash,
      d.gcash,
      d.orderCount,
      d.itemsSold,
    ]);
    downloadCsv(`kreamko_daily_sales_${data.startDate}_to_${data.endDate}.csv`, [
      headers,
      ...rows,
    ]);
  };

  const handleExportSalesTransactions = () => {
    if (!data.salesTransactions || data.salesTransactions.length === 0) return;
    const headers = [
      "Sale ID",
      "Date & Time",
      "Sale Date",
      "Payment Method",
      "Total Amount (PHP)",
      "Items Count",
      "Items Summary",
      "Recorded by",
      "Notes",
    ];
    const rows = data.salesTransactions.map((s) => [
      s.id,
      formatManilaDateTime(s.createdAt),
      s.saleDate,
      s.paymentMethod,
      s.totalAmount,
      s.itemsCount,
      s.itemsSummary,
      s.recordedBy,
      s.notes || "",
    ]);
    downloadCsv(
      `kreamko_sales_transactions_${data.startDate}_to_${data.endDate}.csv`,
      [headers, ...rows]
    );
  };

  const handleExportWastage = () => {
    const headers = [
      "Item Name",
      "Unit",
      "Quantity Wasted",
      "Estimated Cost Loss (PHP)",
    ];
    const rows = data.wastageItems.map((w) => [
      w.itemName,
      w.unitLabel,
      w.quantity,
      w.estimatedCost,
    ]);
    downloadCsv(`kreamko_wastage_${data.startDate}_to_${data.endDate}.csv`, [
      headers,
      ...rows,
    ]);
  };

  const handleExportStockUsage = () => {
    const headers = [
      "Item Name",
      "Category",
      "Current Stock",
      "Unit",
      "Total Used in Period",
      "Avg Daily Usage",
      "Days Remaining",
      "Suggested Restock (Packs)",
    ];
    const rows = data.stockSuggestions.map((s) => [
      s.name,
      s.category,
      s.currentQuantity,
      s.unitLabel,
      s.totalUsed,
      s.avgDailyUsage,
      s.daysRemaining > 90 ? "90+" : s.daysRemaining,
      s.suggestedRestock,
    ]);
    downloadCsv(`kreamko_stock_usage_${data.startDate}_to_${data.endDate}.csv`, [
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Selection Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
            Reports & Insights
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Range: <strong className="text-gray-800">{formatManilaDate(data.startDate)}</strong>{" "}
            &ndash; <strong className="text-gray-800">{formatManilaDate(data.endDate)}</strong>{" "}
            ({data.daysCount} day{data.daysCount === 1 ? "" : "s"})
          </p>
        </div>

        {/* Quick Range Pills + Export Menu */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Range Buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E5E1DC] shadow-2xs">
            {(
              [
                ["today", "Today"],
                ["7days", "7 Days"],
                ["30days", "30 Days"],
                ["this_month", "This Month"],
                ["custom", "Custom"],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => handleRangeChange(t)}
                disabled={isPending}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  rangeType === t
                    ? "bg-gray-900 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* CSV Export Dropdown / Buttons */}
          <div ref={exportRef} className="relative">
            <button
              type="button"
              onClick={() => setIsExportOpen((prev) => !prev)}
              className="py-2.5 px-3.5 rounded-2xl bg-[#C8F0DE] hover:bg-[#A8E6CF] text-emerald-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer select-none"
              title="Open CSV export menu"
            >
              <Download className="w-4 h-4 text-emerald-800" />
              <span>Export CSV</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-emerald-800 transition-transform ${
                  isExportOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Click-to-Open Dropdown Menu */}
            {isExportOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E5E1DC] p-1.5 z-40 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    handleExportSalesTransactions();
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Sales Transactions CSV (Recorded By)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportDailySales();
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-sky-700" />
                  <span>Daily Sales Summary CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportWastage();
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Wastage Report CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportStockUsage();
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Stock Usage & Restock CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Form (Shown only if rangeType === "custom") */}
      {rangeType === "custom" && (
        <form
          onSubmit={handleApplyCustomRange}
          className="p-4 rounded-3xl bg-white border border-[#E5E1DC] flex flex-wrap items-center gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">From:</span>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-[#E5E1DC] text-xs font-semibold text-gray-800 bg-[#FFFDF9]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">To:</span>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-[#E5E1DC] text-xs font-semibold text-gray-800 bg-[#FFFDF9]"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="py-1.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {isPending ? "Loading..." : "Filter Range"}
          </button>
        </form>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide border-b border-[#E5E1DC]">
        <button
          type="button"
          onClick={() => setActiveTab("sales")}
          className={`py-2 px-4 rounded-t-2xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
            activeTab === "sales"
              ? "border-[#b82e46] text-gray-900 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Sales & Cash / E-Wallet
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`py-2 px-4 rounded-t-2xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
            activeTab === "products"
              ? "border-[#b82e46] text-gray-900 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Products & Flavors
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`py-2 px-4 rounded-t-2xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
            activeTab === "stock"
              ? "border-[#b82e46] text-gray-900 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Stock Usage & Wastage
        </button>
        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("cash")}
              className={`py-2 px-4 rounded-t-2xl text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === "cash"
                  ? "border-[#b82e46] text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>Cash Drawer Logs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profit")}
              className={`py-2 px-4 rounded-t-2xl text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === "profit"
                  ? "border-[#b82e46] text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Estimated Margin</span>
            </button>
          </>
        )}
      </div>

      {/* ─── TAB 1: Sales & Revenue ────────────────────────── */}
      {activeTab === "sales" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Revenue */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Total Revenue
              </span>
              <span className="text-xl sm:text-2xl font-display font-extrabold text-gray-900 block">
                {formatPeso(data.summary.totalRevenue)}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                Avg {formatPeso(data.summary.totalRevenue / data.daysCount)} / day
              </span>
            </div>

            {/* Cash Sales */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                Cash Sales
              </span>
              <span className="text-xl sm:text-2xl font-display font-extrabold text-emerald-950 block">
                {formatPeso(data.summary.cashSales)}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                {data.summary.cashPercentage}% of total
              </span>
            </div>

            {/* E-Wallet Sales */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block mb-1">
                E-Wallet Sales
              </span>
              <span className="text-xl sm:text-2xl font-display font-extrabold text-sky-950 block">
                {formatPeso(data.summary.gcashSales)}
              </span>
              <span className="text-[11px] font-bold text-sky-700 mt-1 block">
                {data.summary.gcashPercentage}% of total
              </span>
            </div>

            {/* Orders & Avg Ticket */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Orders & Ticket Size
              </span>
              <span className="text-xl sm:text-2xl font-display font-extrabold text-gray-900 block">
                {data.summary.totalOrders}{" "}
                <span className="text-xs font-semibold text-gray-500">orders</span>
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                Avg {formatPeso(data.summary.averageOrderValue)} / order ({data.summary.totalItemsSold} items)
              </span>
            </div>
          </div>

          {/* Cash vs E-Wallet Visual Ratio Bar */}
          <div className="p-5 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#A8E6CF]" />
                <span className="text-gray-800">
                  Cash: {formatPeso(data.summary.cashSales)} ({data.summary.cashPercentage}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-300" />
                <span className="text-gray-800">
                  E-Wallet: {formatPeso(data.summary.gcashSales)} ({data.summary.gcashPercentage}%)
                </span>
              </div>
            </div>

            <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden flex">
              <div
                style={{ width: `${data.summary.cashPercentage}%` }}
                className="h-full bg-[#A8E6CF] transition-all duration-300"
              />
              <div
                style={{ width: `${data.summary.gcashPercentage}%` }}
                className="h-full bg-sky-300 transition-all duration-300"
              />
            </div>
          </div>

          {/* Daily Breakdown Table */}
          <div className="bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Daily Sales Log
              </h3>
              <span className="text-xs text-gray-400">
                {data.dailySales.length} calendar day{data.dailySales.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E1DC] text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Orders</th>
                    <th className="py-2.5 px-3">Items Sold</th>
                    <th className="py-2.5 px-3 text-right">Cash</th>
                    <th className="py-2.5 px-3 text-right">E-Wallet</th>
                    <th className="py-2.5 px-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1DC]/60">
                  {data.dailySales.map((d) => (
                    <tr key={d.date} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-gray-900">
                        {d.displayDate}
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-medium">
                        {d.orderCount}
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-medium">
                        {d.itemsSold}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-900 font-medium">
                        {formatPeso(d.cash)}
                      </td>
                      <td className="py-3 px-3 text-right text-sky-950 font-medium">
                        {formatPeso(d.gcash)}
                      </td>
                      <td className="py-3 px-3 text-right font-display font-extrabold text-gray-900">
                        {formatPeso(d.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Peak Hours Breakdown */}
          <div className="bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Peak Sales Hours
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Counter activity across hours of the day (Manila Time)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {data.peakHours.map((h) => {
                const isRush = h.salesCount >= 5;
                return (
                  <div
                    key={h.hour}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isRush
                        ? "bg-[#FFECC4] border-[#FFE0A3]"
                        : "bg-[#FFFDF9] border-[#E5E1DC]"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">
                      {h.hourLabel}
                    </span>
                    <span className="text-sm font-extrabold text-gray-900 block font-display">
                      {h.salesCount}{" "}
                      <span className="text-[10px] font-normal text-gray-500">
                        sales
                      </span>
                    </span>
                    <span className="text-[10px] font-semibold text-gray-600 block mt-0.5">
                      {formatPeso(h.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Products & Flavors ─────────────────────── */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-150">
          {/* Top Selling Products (lg:col-span-6) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Top Products by Revenue
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Highest grossing menu items in this period
              </p>
            </div>

            {data.topProducts.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No product sales recorded in this period.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.topProducts.slice(0, 8).map((prod, idx) => (
                  <div
                    key={prod.name}
                    className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-xl bg-gray-100 text-gray-700 font-display font-extrabold flex items-center justify-center text-xs shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-gray-900 block">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {prod.category} &bull; {prod.quantitySold} sold
                        </span>
                      </div>
                    </div>
                    <span className="font-display font-extrabold text-sm text-gray-900">
                      {formatPeso(prod.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Top Flavors + Slow Movers (lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Top Ice Cream Flavors */}
            <div className="bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Most Popular Flavors
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ordered flavors across all cones, tubs, sundaes, & floats
                </p>
              </div>

              {data.topFlavors.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  No flavor sales logged in this period.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {data.topFlavors.map((f, idx) => (
                    <div
                      key={f.flavor}
                      className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC] flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">
                          Rank #{idx + 1}
                        </span>
                        <span className="font-bold text-gray-900 truncate block">
                          {f.flavor}
                        </span>
                      </div>
                      <span className="text-xs font-display font-extrabold text-[#b82e46] bg-[#FFD6DE]/60 px-2 py-0.5 rounded-lg shrink-0">
                        {f.quantitySold}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slow Movers */}
            <div className="bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Slow-Moving Items
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Menu products with lowest sales in this period
                </p>
              </div>

              <div className="space-y-2">
                {data.slowProducts.map((p) => (
                  <div
                    key={p.name}
                    className="p-2.5 rounded-2xl border border-dashed border-[#E5E1DC] flex items-center justify-between text-xs text-gray-600"
                  >
                    <span>{p.name}</span>
                    <span className="font-bold text-gray-400">
                      {p.quantitySold} sold ({formatPeso(p.revenue)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Stock Usage & Wastage ──────────────────── */}
      {activeTab === "stock" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Wastage Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                Wastage Items
              </span>
              <span className="text-xl sm:text-2xl font-display font-extrabold text-rose-950 block">
                {data.summary.totalWastageQuantity}{" "}
                <span className="text-xs font-semibold text-gray-500">packs/units</span>
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                Estimated Wastage Loss
              </span>
              <span className="text-xl sm:text-2xl font-display font-extrabold text-rose-950 block">
                {formatPeso(data.summary.totalWastageCost)}
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Wastage Ratio
              </span>
              <span className="text-xl sm:text-2xl font-display font-extrabold text-gray-900 block">
                {data.summary.totalRevenue > 0
                  ? `${Math.round(
                      (data.summary.totalWastageCost / data.summary.totalRevenue) * 1000
                    ) / 10}%`
                  : "0%"}
              </span>
              <span className="text-[10px] text-gray-400">Loss vs Total Revenue</span>
            </div>
          </div>

          {/* 2-Column: Wastage by Reason & Wastage by Item */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wastage by Reason */}
            <div className="bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900">
                Wastage by Reason
              </h3>

              {data.wastageReasons.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  No wastage logged in this period. Great job! 🎉
                </p>
              ) : (
                <div className="space-y-2.5">
                  {data.wastageReasons.map((r) => (
                    <div
                      key={r.reason}
                      className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900 block">
                          {r.label}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {r.count} incident{r.count === 1 ? "" : "s"} &bull; {r.quantity} packs
                        </span>
                      </div>
                      <span className="font-display font-extrabold text-rose-700">
                        {formatPeso(r.estimatedCost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wastage by Item */}
            <div className="bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900">
                Most Wasted Stock Items
              </h3>

              {data.wastageItems.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  Zero stock wastage recorded.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {data.wastageItems.slice(0, 6).map((item) => (
                    <div
                      key={item.itemName}
                      className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900 block">
                          {item.itemName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {item.quantity} {item.unitLabel} lost
                        </span>
                      </div>
                      <span className="font-display font-extrabold text-rose-700">
                        {formatPeso(item.estimatedCost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Restock Suggestions based on Usage Rate */}
          <div className="bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Stock Usage & Restock Suggestions
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Computed from daily EOD stock count usage and current stock on hand
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E1DC] text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Stock Item</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Used in Period</th>
                    <th className="py-2.5 px-3">Daily Avg</th>
                    <th className="py-2.5 px-3">Days Left</th>
                    <th className="py-2.5 px-3 text-right">Suggested Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1DC]/60">
                  {data.stockSuggestions.slice(0, 15).map((s) => (
                    <tr key={s.stockItemId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-gray-900">
                        <div>{s.name}</div>
                        <span className="text-[9px] text-gray-400 uppercase font-semibold">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-800">
                        {s.currentQuantity} {s.unitLabel}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {s.totalUsed} {s.unitLabel}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {s.avgDailyUsage} {s.unitLabel}/day
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                            s.daysRemaining <= 2
                              ? "bg-rose-100 text-rose-800"
                              : s.daysRemaining <= 5
                              ? "bg-amber-100 text-amber-900"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {s.daysRemaining > 90 ? "90+ days" : `${s.daysRemaining} days`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-display font-extrabold text-gray-900">
                        {s.suggestedRestock > 0 ? (
                          <span className="text-[#b82e46]">
                            +{s.suggestedRestock} {s.unitLabel}
                          </span>
                        ) : (
                          <span className="text-emerald-700">Stocked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Cash Drawer History (Admin Only) ────────── */}
      {isAdmin && activeTab === "cash" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Cash Counts Summary */}
          {data.cashCountSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Cash Counts Logged
                </span>
                <span className="text-xl sm:text-2xl font-display font-extrabold text-gray-900 block">
                  {data.cashCountSummary.countsCount}
                </span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                  Total Shortages
                </span>
                <span className="text-xl sm:text-2xl font-display font-extrabold text-rose-950 block">
                  {formatPeso(data.cashCountSummary.totalShortage)}
                </span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block mb-1">
                  Total Overages
                </span>
                <span className="text-xl sm:text-2xl font-display font-extrabold text-sky-950 block">
                  {formatPeso(data.cashCountSummary.totalOverage)}
                </span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Net Difference
                </span>
                <span
                  className={`text-xl sm:text-2xl font-display font-extrabold block ${
                    data.cashCountSummary.netDifference >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {data.cashCountSummary.netDifference >= 0 ? "+" : ""}
                  {formatPeso(data.cashCountSummary.netDifference)}
                </span>
              </div>
            </div>
          )}

          {/* Cash Counts Log Table */}
          <div className="bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              End-of-Day Cash Drawer Records
            </h3>

            {!data.cashCounts || data.cashCounts.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No closing cash counts found in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E1DC] text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Starting (Change)</th>
                      <th className="py-2.5 px-3">Cash Sales</th>
                      <th className="py-2.5 px-3">Expected Cash</th>
                      <th className="py-2.5 px-3">Counted in Drawer</th>
                      <th className="py-2.5 px-3 text-right">Difference</th>
                      <th className="py-2.5 px-3">Counted By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1DC]/60">
                    {data.cashCounts.map((c) => {
                      const isBalanced = c.difference === 0;
                      const isShort = c.difference < 0;

                      return (
                        <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-gray-900">
                            {formatManilaDate(c.countDate)}
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            {formatPeso(c.startingCash)}
                          </td>
                          <td className="py-3 px-3 text-emerald-900 font-medium">
                            {formatPeso(c.cashSales)}
                          </td>
                          <td className="py-3 px-3 text-gray-700 font-semibold">
                            {formatPeso(c.expectedCash)}
                          </td>
                          <td className="py-3 px-3 text-gray-900 font-bold">
                            {formatPeso(c.countedCash)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                isBalanced
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isShort
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-sky-100 text-sky-800"
                              }`}
                            >
                              {isBalanced
                                ? "Balanced"
                                : `${c.difference > 0 ? "+" : ""}${formatPeso(c.difference)}`}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-500 text-[11px]">
                            {c.recordedByName || "Staff"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: Profit & Margin (Admin Only) ────────────── */}
      {isAdmin && activeTab === "profit" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 rounded-3xl bg-white border border-[#E5E1DC] shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-[#C8F0DE] px-2 py-0.5 rounded-md inline-block mb-1">
                Admin Financial Estimate
              </span>
              <h2 className="text-xl font-bold text-gray-900">
                Gross Margin Estimate
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Based on recorded retail sales minus logged wastage loss and unit cost prices
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E5E1DC]">
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC]">
                <span className="text-xs font-bold text-gray-500 block">
                  Gross Sales
                </span>
                <span className="text-xl font-display font-extrabold text-gray-900 mt-1 block">
                  {formatPeso(data.summary.totalRevenue)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC]">
                <span className="text-xs font-bold text-rose-700 block">
                  Wastage Loss
                </span>
                <span className="text-xl font-display font-extrabold text-rose-950 mt-1 block">
                  -{formatPeso(data.summary.totalWastageCost)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#C8F0DE]/40 border border-[#A8E6CF]">
                <span className="text-xs font-bold text-emerald-900 block">
                  Estimated Gross Profit
                </span>
                <span className="text-xl font-display font-extrabold text-emerald-950 mt-1 block">
                  {formatPeso(data.summary.estimatedGrossProfit || 0)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed pt-2">
              Note: Accurate cost calculations depend on entering ingredient cost prices in the Stock Inventory tab. Rent, electricity, and stall wages are tracked separately outside this counter app.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

