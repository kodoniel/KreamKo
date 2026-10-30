"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { formatPeso, formatManilaDate } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface CopySummaryButtonProps {
  stats: DashboardStats;
}

export function CopySummaryButton({ stats }: CopySummaryButtonProps) {
  const [copied, setCopied] = useState(false);

  const generateSummaryText = () => {
    const todayStr = formatManilaDate(new Date());

    let cashDrawerText = "⚠️ Pending End-of-Day Cash Count";
    if (stats.eodCashCountDone && stats.eodCashCountDetails) {
      const { expectedCash, countedCash, difference } = stats.eodCashCountDetails;
      const diffLabel =
        difference === 0
          ? "Balanced"
          : difference > 0
          ? `+${formatPeso(difference)} Over`
          : `${formatPeso(difference)} Short`;

      cashDrawerText = `Expected: ${formatPeso(expectedCash)} | Counted: ${formatPeso(
        countedCash
      )} (${diffLabel})`;
    }

    let lowStockText = "✅ All items well-stocked";
    if (stats.lowStockItems.length > 0) {
      lowStockText = stats.lowStockItems
        .slice(0, 5)
        .map(
          (item) =>
            `• ${item.name}: ${item.currentQuantity} ${item.unitLabel}${
              item.currentQuantity <= 0 ? " [OUT OF STOCK]" : ""
            }`
        )
        .join("\n");
      if (stats.lowStockItems.length > 5) {
        lowStockText += `\n...and ${stats.lowStockItems.length - 5} more items`;
      }
    }

    return `🍦 Kream Ko Summary — ${todayStr}
━━━━━━━━━━━━━━━━━━━━━━
💰 Total Sales: ${formatPeso(stats.todaySales)}
   • Cash: ${formatPeso(stats.cashSales)}
   • E-Wallet: ${formatPeso(stats.gcashSales)}
🧾 Orders: ${stats.transactionCount} (${stats.itemsSold} items sold)
⭐ Top Seller: ${stats.bestProduct || "None yet"}
🍨 Top Flavor: ${stats.bestFlavor || "None yet"}

💵 Cash Drawer:
   ${cashDrawerText}

🗑️ Wastage Today: ${stats.todayWastageCount} items${
      stats.todayWastageCost > 0 ? ` (~${formatPeso(stats.todayWastageCost)} loss)` : ""
    }

⚠️ Low Stock:
${lowStockText}
━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const handleCopy = async () => {
    const text = generateSummaryText();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older webviews / non-HTTPS local dev
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy summary:", err);
      alert("Unable to copy to clipboard. Please allow clipboard permissions.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`py-2.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer select-none ${
        copied
          ? "bg-emerald-600 text-white shadow-emerald-200"
          : "bg-white hover:bg-[#FFD6DE]/30 text-gray-800 border border-[#E5E1DC] active:scale-95"
      }`}
      title="Copy daily summary formatted for Messenger / Chat"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-white" />
          <span>Copied to Messenger!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 text-[#b82e46]" />
          <span>Copy Summary</span>
        </>
      )}
    </button>
  );
}

