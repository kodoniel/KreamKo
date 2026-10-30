"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { saveEndOfDayStockCount } from "@/lib/actions/inventory";
import { formatManilaDate, generateUUID } from "@/lib/utils";
import { queueEODStockCountOffline } from "@/lib/offline/sync";
import { ClipboardCheck, AlertCircle, Sparkles } from "lucide-react";
import type { StockItem } from "@prisma/client";

interface EndOfDayStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockItem[];
  onSuccess: (updatedItems: { id: string; newQty: number }[]) => void;
}

export function EndOfDayStockModal({
  isOpen,
  onClose,
  items,
  onSuccess,
}: EndOfDayStockModalProps) {
  // Map of stockItemId -> remainingQty
  const [counts, setCounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const item of items) {
      init[item.id] = String(item.currentQuantity);
    }
    return init;
  });

  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeItems = items.filter((i) => i.isActive);
  const categories = Array.from(new Set(activeItems.map((i) => i.category)));

  const handleCountChange = (id: string, val: string) => {
    setCounts((prev) => ({ ...prev, [id]: val }));
  };

  const handleFillAllWithCurrent = () => {
    const filled: Record<string, string> = {};
    for (const item of activeItems) {
      filled[item.id] = String(item.currentQuantity);
    }
    setCounts(filled);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = activeItems.map((item) => {
      const val = parseFloat(counts[item.id] ?? "0");
      return {
        stockItemId: item.id,
        remainingQty: isNaN(val) ? item.currentQuantity : Math.max(0, val),
      };
    });

    startTransition(async () => {
      // Offline fallback
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueEODStockCountOffline({
          id: generateUUID(),
          countDate: new Date().toISOString(),
          items: payload,
          notes: notes.trim() || undefined,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        alert("EOD stock count saved offline! It will sync once you reconnect.");
        onSuccess(
          payload.map((p) => ({ id: p.stockItemId, newQty: p.remainingQty }))
        );
        onClose();
        return;
      }

      try {
        const res = await saveEndOfDayStockCount({
          items: payload,
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          onSuccess(
            payload.map((p) => ({ id: p.stockItemId, newQty: p.remainingQty }))
          );
          onClose();
        } else {
          setError(res.error);
        }
      } catch {
        await queueEODStockCountOffline({
          id: generateUUID(),
          countDate: new Date().toISOString(),
          items: payload,
          notes: notes.trim() || undefined,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        onSuccess(
          payload.map((p) => ({ id: p.stockItemId, newQty: p.remainingQty }))
        );
        onClose();
      }
    });
  };

  const todayStr = formatManilaDate(new Date());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End-of-Day Stock Count"
      description={`Enter the remaining packs/bottles at closing (${todayStr}). App will compute total used and reconcile wastage.`}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between bg-[#FFFDF9] p-3 rounded-2xl border border-[#E5E1DC]">
          <span className="text-xs text-gray-600 font-medium">
            Counting {activeItems.length} active inventory items
          </span>
          <button
            type="button"
            onClick={handleFillAllWithCurrent}
            className="text-xs text-[#b82e46] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reset to current</span>
          </button>
        </div>

        {/* Scrollable list grouped by category */}
        <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
          {categories.map((cat) => {
            const catItems = activeItems.filter((i) => i.category === cat);
            return (
              <div key={cat} className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                  {cat}
                </h4>
                <div className="bg-white rounded-2xl border border-[#E5E1DC] divide-y divide-[#E5E1DC]">
                  {catItems.map((item) => {
                    const entered = parseFloat(counts[item.id] ?? "0") || 0;
                    const diff = Math.round((item.currentQuantity - entered) * 100) / 100;

                    return (
                      <div
                        key={item.id}
                        className="p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Was: <strong>{item.currentQuantity}</strong> {item.unitLabel}
                          </p>
                        </div>

                        {/* Live difference indicator */}
                        <div className="text-right text-[11px] font-semibold shrink-0">
                          {diff > 0 ? (
                            <span className="text-amber-800 bg-[#FFECC4] px-2 py-0.5 rounded-md">
                              -{diff} {item.unitLabel}
                            </span>
                          ) : diff < 0 ? (
                            <span className="text-emerald-800 bg-[#C8F0DE] px-2 py-0.5 rounded-md">
                              +{Math.abs(diff)}
                            </span>
                          ) : (
                            <span className="text-gray-400">no change</span>
                          )}
                        </div>

                        {/* Input for remaining quantity */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            value={counts[item.id] ?? ""}
                            onChange={(e) =>
                              handleCountChange(item.id, e.target.value)
                            }
                            className="w-20 py-1.5 px-2.5 text-center text-sm font-bold bg-[#FFFDF9] border border-[#E5E1DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
                          />
                          <span className="text-xs text-gray-400 font-medium w-8 truncate">
                            {item.unitLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Closing Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. End of shift, count verified by Maria"
            className="w-full py-2.5 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-[#E5E1DC]">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={isPending}
          >
            <ClipboardCheck className="w-4 h-4 mr-1.5" />
            <span>Save EOD Count</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

