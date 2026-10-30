"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatManilaDate } from "@/lib/utils";
import { Copy, Check, ShoppingCart, CheckSquare, Square } from "lucide-react";
import type { StockItem } from "@prisma/client";

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockItem[];
}

interface BuyingItem {
  id: string;
  name: string;
  category: string;
  unitLabel: string;
  currentQuantity: number;
  lowStockLevel: number;
  suggestedBuy: number;
  selected: boolean;
}

export function ShoppingListModal({
  isOpen,
  onClose,
  items,
}: ShoppingListModalProps) {
  // Filter items at or below low stock level
  const initialBuyList: BuyingItem[] = items
    .filter((i) => i.isActive && i.currentQuantity <= i.lowStockLevel)
    .map((i) => {
      // Suggested buy = 2 * lowStockLevel - currentQuantity, min 1
      const suggested = Math.max(
        1,
        Math.round((2 * i.lowStockLevel - i.currentQuantity) * 10) / 10
      );
      return {
        id: i.id,
        name: i.name,
        category: i.category,
        unitLabel: i.unitLabel,
        currentQuantity: i.currentQuantity,
        lowStockLevel: i.lowStockLevel,
        suggestedBuy: suggested,
        selected: true,
      };
    });

  const [buyList, setBuyList] = useState<BuyingItem[]>(initialBuyList);
  const [copied, setCopied] = useState(false);

  // Group by category
  const categories = Array.from(new Set(buyList.map((i) => i.category)));

  const handleToggle = (id: string) => {
    setBuyList((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    );
  };

  const handleQtyChange = (id: string, newQty: number) => {
    setBuyList((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, suggestedBuy: Math.max(1, newQty) } : i
      )
    );
  };

  const handleCopyText = async () => {
    const selectedItems = buyList.filter((i) => i.selected);
    if (selectedItems.length === 0) return;

    const dateStr = formatManilaDate(new Date());
    const lines: string[] = [`What to buy (${dateStr})`];

    const activeCategories = Array.from(
      new Set(selectedItems.map((i) => i.category))
    );

    for (const cat of activeCategories) {
      lines.push("");
      lines.push(cat);
      const catItems = selectedItems.filter((i) => i.category === cat);
      for (const item of catItems) {
        lines.push(`- ${item.name}: ${item.suggestedBuy} ${item.unitLabel}${item.suggestedBuy > 1 && item.unitLabel === "pack" ? "s" : ""}`);
      }
    }

    const fullText = lines.join("\n");

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const selectedCount = buyList.filter((i) => i.selected).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="What to Buy (Shopping List)"
      description="Items at or below low-stock level. Check/uncheck or adjust quantities, then copy for Messenger."
      className="max-w-xl"
    >
      <div className="space-y-4">
        {buyList.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[#C8F0DE] text-emerald-800 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              All Items In Stock!
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              No items are currently below their low-stock threshold.
            </p>
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
            {categories.map((cat) => {
              const catItems = buyList.filter((i) => i.category === cat);
              return (
                <div key={cat} className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                    {cat}
                  </h4>
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E5E1DC] divide-y divide-[#E5E1DC] overflow-hidden">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                          item.selected ? "bg-white" : "opacity-40 bg-gray-50"
                        }`}
                      >
                        {/* Checkbox & Name */}
                        <div
                          onClick={() => handleToggle(item.id)}
                          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                        >
                          <button
                            type="button"
                            className="text-gray-600 hover:text-gray-900 shrink-0"
                          >
                            {item.selected ? (
                              <CheckSquare className="w-5 h-5 text-[#b82e46]" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          <div className="truncate">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              Stock: {item.currentQuantity} / min {item.lowStockLevel}{" "}
                              {item.unitLabel}
                            </p>
                          </div>
                        </div>

                        {/* Editable Suggested Buy Qty */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="text-[11px] font-bold text-gray-500">
                            Buy:
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.suggestedBuy}
                            onChange={(e) =>
                              handleQtyChange(
                                item.id,
                                parseFloat(e.target.value) || 1
                              )
                            }
                            className="w-16 py-1 px-2 text-center text-xs font-bold bg-white border border-[#E5E1DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
                          />
                          <span className="text-xs text-gray-500 font-medium">
                            {item.unitLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5E1DC]">
          <span className="text-xs text-gray-500">
            {selectedCount} item{selectedCount === 1 ? "" : "s"} selected
          </span>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={selectedCount === 0}
              onClick={handleCopyText}
              className="min-w-[130px]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-800 mr-1" />
                  <span className="text-emerald-950">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  <span>Copy List</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

