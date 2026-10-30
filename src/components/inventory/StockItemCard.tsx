"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { adjustStock } from "@/lib/actions/inventory";
import { formatPeso, generateUUID } from "@/lib/utils";
import { queueStockChangeOffline } from "@/lib/offline/sync";
import {
  Minus,
  Plus,
  PackagePlus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import type { StockItem } from "@prisma/client";

interface StockItemCardProps {
  item: StockItem;
  isAdmin: boolean;
  onOpenRestock: (item: StockItem) => void;
  onOpenWastage: (item: StockItem) => void;
  onOpenEdit: (item: StockItem) => void;
  onQtyUpdated: (itemId: string, newQty: number) => void;
}

export function StockItemCard({
  item,
  isAdmin,
  onOpenRestock,
  onOpenWastage,
  onOpenEdit,
  onQtyUpdated,
}: StockItemCardProps) {
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [typedQty, setTypedQty] = useState(String(item.currentQuantity));
  const [isAdjusting, startAdjusting] = useTransition();

  // Low stock status calculation
  const isOutOfStock = item.currentQuantity <= 0;
  const isCritical =
    !isOutOfStock && item.currentQuantity <= Math.max(1, item.lowStockLevel * 0.5);
  const isLowStock = !isOutOfStock && !isCritical && item.currentQuantity <= item.lowStockLevel;

  const handleStepDelta = (delta: number) => {
    startAdjusting(async () => {
      // Offline support
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueStockChangeOffline({
          id: generateUUID(),
          stockItemId: item.id,
          changeDelta: delta,
          reason: delta > 0 ? "ADJUSTMENT" : "ADJUSTMENT",
          notes: `Quick step ${delta > 0 ? "+1" : "-1"} at counter`,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        const optimisticQty = Math.max(
          0,
          Math.round((item.currentQuantity + delta) * 100) / 100
        );
        onQtyUpdated(item.id, optimisticQty);
        return;
      }

      try {
        const res = await adjustStock({
          stockItemId: item.id,
          changeDelta: delta,
          reason: delta > 0 ? "ADJUSTMENT" : "ADJUSTMENT",
          notes: `Quick step ${delta > 0 ? "+1" : "-1"} at counter`,
        });

        if (res.success) {
          onQtyUpdated(item.id, res.data.newQty);
        }
      } catch {
        await queueStockChangeOffline({
          id: generateUUID(),
          stockItemId: item.id,
          changeDelta: delta,
          reason: delta > 0 ? "ADJUSTMENT" : "ADJUSTMENT",
          notes: `Quick step ${delta > 0 ? "+1" : "-1"} at counter`,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        const optimisticQty = Math.max(
          0,
          Math.round((item.currentQuantity + delta) * 100) / 100
        );
        onQtyUpdated(item.id, optimisticQty);
      }
    });
  };

  const handleConfirmTypedQty = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(typedQty);
    if (isNaN(val) || val < 0) return;

    const delta = Math.round((val - item.currentQuantity) * 100) / 100;
    if (delta === 0) {
      setIsEditingQty(false);
      return;
    }

    startAdjusting(async () => {
      // Offline support
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueStockChangeOffline({
          id: generateUUID(),
          stockItemId: item.id,
          changeDelta: delta,
          reason: "MANUAL_COUNT",
          notes: `Manual typed count adjusted to ${val}`,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        onQtyUpdated(item.id, val);
        setIsEditingQty(false);
        return;
      }

      try {
        const res = await adjustStock({
          stockItemId: item.id,
          changeDelta: delta,
          reason: "MANUAL_COUNT",
          notes: `Manual typed count adjusted to ${val}`,
        });

        if (res.success) {
          onQtyUpdated(item.id, res.data.newQty);
          setIsEditingQty(false);
        }
      } catch {
        await queueStockChangeOffline({
          id: generateUUID(),
          stockItemId: item.id,
          changeDelta: delta,
          reason: "MANUAL_COUNT",
          notes: `Manual typed count adjusted to ${val}`,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        onQtyUpdated(item.id, val);
        setIsEditingQty(false);
      }
    });
  };

  return (
    <div
      className={`rounded-3xl border transition-all p-4 sm:p-5 flex flex-col justify-between ${
        isOutOfStock
          ? "bg-[#FFD6DE]/30 border-[#FFB5C2] shadow-xs"
          : isCritical
          ? "bg-[#FFF8F0] border-[#FFB5C2] shadow-xs"
          : isLowStock
          ? "bg-[#FFFDF9] border-[#FFE0A3] shadow-xs"
          : "bg-white border-[#E5E1DC] shadow-xs hover:border-gray-300"
      }`}
    >
      <div>
        {/* Header: Category Badge + Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg truncate">
            {item.category}
          </span>

          {isOutOfStock ? (
            <Badge variant="pink" size="sm">
              Out of stock
            </Badge>
          ) : isCritical ? (
            <Badge variant="pink" size="sm" className="gap-0.5">
              <AlertTriangle className="w-3 h-3 inline" />
              Critical
            </Badge>
          ) : isLowStock ? (
            <Badge variant="yellow" size="sm">
              Low: &le;{item.lowStockLevel}
            </Badge>
          ) : (
            <Badge variant="mint" size="sm">
              In Stock
            </Badge>
          )}
        </div>

        {/* Item Name */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug tracking-tight">
            {item.name}
          </h3>
          {isAdmin && (
            <button
              onClick={() => onOpenEdit(item)}
              title="Edit stock item"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Cost Price (Admin only) */}
        {isAdmin && item.costPrice && (
          <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
            Cost: {formatPeso(item.costPrice)} / {item.unitLabel}
          </p>
        )}
      </div>

      {/* Counter Controls */}
      <div className="mt-4 pt-3 border-t border-[#E5E1DC]/80 space-y-3">
        {/* Step Quantity Controls */}
        <div className="flex items-center justify-between bg-[#FFFDF9] p-1.5 rounded-2xl border border-[#E5E1DC]">
          <button
            type="button"
            disabled={isAdjusting || item.currentQuantity <= 0}
            onClick={() => handleStepDelta(-1)}
            aria-label="Decrease quantity by 1"
            className="w-10 h-10 rounded-xl bg-white hover:bg-[#FFD6DE] active:bg-[#ffbac8] text-gray-700 hover:text-[#b82e46] border border-[#E5E1DC] flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Current Quantity (Click to type) */}
          <div className="flex-1 text-center px-2">
            {isEditingQty ? (
              <form
                onSubmit={handleConfirmTypedQty}
                className="flex items-center justify-center gap-1"
              >
                <input
                  type="number"
                  step="any"
                  min="0"
                  autoFocus
                  value={typedQty}
                  onChange={(e) => setTypedQty(e.target.value)}
                  className="w-16 py-1 px-1.5 text-center text-sm font-bold bg-white border border-[#FFB5C2] rounded-lg focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingQty(false)}
                  className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTypedQty(String(item.currentQuantity));
                  setIsEditingQty(true);
                }}
                title="Tap to type count manually"
                className="group/qty py-1 px-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span className="text-xl sm:text-2xl font-display font-extrabold text-gray-900 group-hover/qty:text-[#b82e46] transition-colors">
                  {item.currentQuantity}
                </span>
                <span className="text-xs text-gray-400 ml-1 font-medium">
                  {item.unitLabel}
                  {item.currentQuantity !== 1 && item.unitLabel === "pack" ? "s" : ""}
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={isAdjusting}
            onClick={() => handleStepDelta(1)}
            aria-label="Increase quantity by 1"
            className="w-10 h-10 rounded-xl bg-white hover:bg-[#C8F0DE] active:bg-[#A8E6CF] text-gray-700 hover:text-emerald-900 border border-[#E5E1DC] flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions (Restock & Wastage) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenRestock(item)}
            className="py-2 px-2.5 rounded-xl bg-[#FFFDF9] hover:bg-[#FFECC4] active:bg-[#FFE0A3] text-gray-800 border border-[#E5E1DC] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <PackagePlus className="w-3.5 h-3.5 text-amber-700" />
            <span>Restock</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenWastage(item)}
            className="py-2 px-2.5 rounded-xl bg-[#FFFDF9] hover:bg-[#FFD6DE]/60 active:bg-[#FFD6DE] text-gray-800 hover:text-[#b82e46] border border-[#E5E1DC] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#b82e46]" />
            <span>Wastage</span>
          </button>
        </div>
      </div>
    </div>
  );
}

