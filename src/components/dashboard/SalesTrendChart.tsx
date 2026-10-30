"use client";

import { formatPeso } from "@/lib/utils";

interface SalesTrendChartProps {
  data: {
    date: string;
    dayLabel: string;
    total: number;
    cash: number;
    gcash: number;
  }[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  // Find highest total for scale
  const maxSales = Math.max(...data.map((d) => d.total), 100);

  return (
    <div className="bg-white rounded-3xl border border-[#E5E1DC] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">7-Day Sales Trend</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Daily revenue with Cash vs E-Wallet breakdown
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A8E6CF]" />
            <span className="text-gray-600 font-medium text-[11px]">Cash</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-300" />
            <span className="text-gray-600 font-medium text-[11px]">E-Wallet</span>
          </div>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-[#E5E1DC]/80">
        {data.map((item, idx) => {
          const heightPercent = Math.max(6, Math.round((item.total / maxSales) * 100));
          const isToday = item.dayLabel === "Today";

          // Calculate sub-bars for Cash and GCash
          const cashPercent = item.total > 0 ? (item.cash / item.total) * 100 : 50;
          const gcashPercent = item.total > 0 ? (item.gcash / item.total) * 100 : 50;

          return (
            <div
              key={item.date}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center pointer-events-none transition-all">
                <div className="bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap">
                  <div>{formatPeso(item.total)}</div>
                  <div className="text-gray-300 text-[9px] font-normal">
                    Cash: {formatPeso(item.cash)} | E-Wallet: {formatPeso(item.gcash)}
                  </div>
                </div>
                <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5" />
              </div>

              {/* Amount Label above bar for today or non-zero */}
              <span
                className={`text-[10px] font-bold mb-1 transition-colors ${
                  isToday ? "text-[#b82e46]" : "text-gray-400 group-hover:text-gray-800"
                }`}
              >
                {item.total > 0 ? `₱${Math.round(item.total)}` : "₱0"}
              </span>

              {/* Bar Column */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full max-w-[36px] rounded-t-xl overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:brightness-95 ${
                  isToday ? "ring-2 ring-[#FFB5C2] ring-offset-1" : ""
                }`}
              >
                {/* Cash Segment */}
                <div
                  style={{ height: `${cashPercent}%` }}
                  className="w-full bg-[#A8E6CF]"
                  title={`Cash: ${formatPeso(item.cash)}`}
                />
                {/* E-Wallet Segment */}
                <div
                  style={{ height: `${gcashPercent}%` }}
                  className="w-full bg-sky-300"
                  title={`E-Wallet: ${formatPeso(item.gcash)}`}
                />
              </div>

              {/* Day Label */}
              <span
                className={`text-[11px] font-bold mt-2 truncate ${
                  isToday
                    ? "text-[#b82e46] font-extrabold"
                    : "text-gray-500 group-hover:text-gray-800"
                }`}
              >
                {item.dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

