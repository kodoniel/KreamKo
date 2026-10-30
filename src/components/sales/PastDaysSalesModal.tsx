"use client";

import { useState, useMemo, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getSalesForDay } from "@/lib/actions/sales";
import {
  formatPeso,
  formatManilaDateTime,
  getManilaDateString,
  formatRecordedBy,
} from "@/lib/utils";
import { downloadCsv } from "@/lib/csvExport";
import {
  Calendar,
  Banknote,
  Smartphone,
  AlertCircle,
  User,
  Download,
  Filter,
  X,
} from "lucide-react";
import type { SaleWithItems } from "@/types";

interface PastDaysSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSales: SaleWithItems[];
  initialTotals: { total: number; cash: number; gcash: number; count: number };
}

export function PastDaysSalesModal({
  isOpen,
  onClose,
  initialSales,
  initialTotals,
}: PastDaysSalesModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(getManilaDateString());
  const [sales, setSales] = useState<SaleWithItems[]>(initialSales);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setError(null);

    startTransition(async () => {
      const res = await getSalesForDay(newDate);
      if (res.success) {
        setSales(res.data.sales);
        setSelectedUserFilter("ALL");
      } else {
        setError(res.error);
      }
    });
  };

  // Extract unique users who recorded sales on this date
  const recordedByOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const sale of sales) {
      const key = sale.recordedById || (sale.recordedBy?.id ?? "unknown");
      const name = formatRecordedBy(sale.recordedBy);
      map.set(key, name);
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [sales]);

  // Filter sales based on selected user
  const filteredSales = useMemo(() => {
    if (selectedUserFilter === "ALL") return sales;
    if (selectedUserFilter === "unknown") {
      return sales.filter((s) => !s.recordedById && !s.recordedBy);
    }
    return sales.filter(
      (s) => s.recordedById === selectedUserFilter || s.recordedBy?.id === selectedUserFilter
    );
  }, [sales, selectedUserFilter]);

  // Dynamically compute totals for the filtered sales
  const displayedTotals = useMemo(() => {
    let total = 0;
    let cash = 0;
    let gcash = 0;
    for (const s of filteredSales) {
      total += s.totalAmount;
      if (s.paymentMethod === "CASH") {
        cash += s.totalAmount;
      } else {
        gcash += s.totalAmount;
      }
    }
    return {
      total: Math.round(total * 100) / 100,
      cash: Math.round(cash * 100) / 100,
      gcash: Math.round(gcash * 100) / 100,
      count: filteredSales.length,
    };
  }, [filteredSales]);

  // CSV export with "Recorded by" column
  const handleExportCsv = () => {
    if (filteredSales.length === 0) return;
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
    const rows = filteredSales.map((s) => [
      s.id,
      formatManilaDateTime(s.createdAt),
      s.saleDate,
      s.paymentMethod === "CASH" ? "Cash" : "E-Wallet",
      s.totalAmount,
      s.items.reduce((sum, it) => sum + it.quantity, 0),
      s.items.map((it) => `${it.quantity}x ${it.productName} (${it.variantName})`).join("; "),
      formatRecordedBy(s.recordedBy),
      s.notes || "",
    ]);
    downloadCsv(
      `kreamko_sales_${selectedDate}${selectedUserFilter !== "ALL" ? `_user` : ""}.csv`,
      [headers, ...rows]
    );
  };

  const activeUserLabel =
    selectedUserFilter !== "ALL"
      ? recordedByOptions.find((o) => o.id === selectedUserFilter)?.label || "Selected User"
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sales History"
      description="View past sales transactions, filter by cashier, and inspect line items."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Controls Bar: Date + Recorded By Filter + CSV Export */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC]">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[170px]">
            <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-xs font-bold text-gray-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="flex-1 py-1.5 px-2.5 bg-white border border-[#E5E1DC] rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
            />
          </div>

          {/* Recorded By Filter */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[170px]">
            <User className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Staff:</span>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="flex-1 py-1.5 px-2 bg-white border border-[#E5E1DC] rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2] cursor-pointer"
              title="Filter sales by user who recorded them"
            >
              <option value="ALL">All Staff ({sales.length})</option>
              {recordedByOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredSales.length === 0}
            className="py-1.5 px-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-[#E5E1DC] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-40 self-end sm:self-auto shrink-0"
            title="Download CSV for this date and filter"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Indicator Pill if user filter is active */}
        {activeUserLabel && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#FFECC4]/60 border border-[#FFE0A3] text-xs text-amber-950 font-medium">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-800" />
              <span>
                Filtered by: <strong>{activeUserLabel}</strong> ({filteredSales.length} sale
                {filteredSales.length === 1 ? "" : "s"})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUserFilter("ALL")}
              className="text-[11px] font-bold text-amber-900 hover:text-amber-950 flex items-center gap-0.5 cursor-pointer underline"
            >
              <X className="w-3 h-3" />
              <span>Show All</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Day Totals Summary (Dynamically updates with filter) */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white border border-[#E5E1DC] text-center shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Total Sales
            </span>
            <span className="text-sm font-display font-extrabold text-gray-900 block mt-0.5">
              {formatPeso(displayedTotals.total)}
            </span>
            <span className="text-[10px] text-gray-400">{displayedTotals.count} txns</span>
          </div>

          <div className="border-x border-[#E5E1DC] px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Cash
            </span>
            <span className="text-sm font-display font-extrabold text-emerald-950 block mt-0.5">
              {formatPeso(displayedTotals.cash)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
              E-Wallet
            </span>
            <span className="text-sm font-display font-extrabold text-sky-950 block mt-0.5">
              {formatPeso(displayedTotals.gcash)}
            </span>
          </div>
        </div>

        {/* Sales Transactions List */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
          {filteredSales.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">
              {sales.length === 0
                ? "No sales recorded on this date."
                : `No sales recorded by ${activeUserLabel || "this user"} on this date.`}
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC] space-y-2 text-xs hover:border-[#FFB5C2]/70 transition-colors"
              >
                {/* Header: Payment Method + Date/Time + Recorded By + Total Amount */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        sale.paymentMethod === "CASH"
                          ? "bg-[#C8F0DE] text-emerald-950"
                          : "bg-sky-100 text-sky-950"
                      }`}
                    >
                      {sale.paymentMethod === "CASH" ? (
                        <Banknote className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <Smartphone className="w-3 h-3 text-sky-700" />
                      )}
                      <span>{sale.paymentMethod === "CASH" ? "Cash" : "E-Wallet"}</span>
                    </span>

                    <span className="text-[11px] text-gray-400">
                      {formatManilaDateTime(sale.createdAt)}
                    </span>

                    <span className="text-gray-300 hidden sm:inline">&bull;</span>

                    {/* Recorded by User Name (Subtle user tag) */}
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <User className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>
                        Recorded by{" "}
                        <strong className="text-gray-700 font-semibold">
                          {formatRecordedBy(sale.recordedBy)}
                        </strong>
                      </span>
                    </span>
                  </div>

                  <span className="font-display font-extrabold text-sm text-gray-900 self-start sm:self-auto">
                    {formatPeso(sale.totalAmount)}
                  </span>
                </div>

                {/* Line Items */}
                <div className="pl-2 border-l-2 border-[#E5E1DC] space-y-0.5 text-[11px] text-gray-600">
                  {sale.items.map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span>
                        {it.quantity}× {it.productName} ({it.variantName})
                      </span>
                      <span className="font-semibold">{formatPeso(it.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {sale.notes && (
                  <p className="text-[10px] text-gray-400 italic">
                    Note: &quot;{sale.notes}&quot;
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-[#E5E1DC] flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
