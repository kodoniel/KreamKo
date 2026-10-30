"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { logWastage } from "@/lib/actions/inventory";
import { generateUUID } from "@/lib/utils";
import { queueWastageOffline } from "@/lib/offline/sync";
import { Trash2, AlertCircle } from "lucide-react";
import { WASTAGE_REASONS, WASTAGE_REASON_LABELS } from "@/lib/constants";
import type { StockItem } from "@prisma/client";

interface WastageModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
  allItems?: StockItem[];
  onSuccess: (itemId: string, newQty: number) => void;
}

export function WastageModal({
  isOpen,
  onClose,
  item: initialItem,
  allItems = [],
  onSuccess,
}: WastageModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem?.id || (allItems[0]?.id ?? "")
  );
  const [qty, setQty] = useState<string>("1");
  const [reason, setReason] = useState<keyof typeof WASTAGE_REASON_LABELS>("SPOILED");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeItem = initialItem || allItems.find((i) => i.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activeItem) {
      setError("Please select a stock item");
      return;
    }

    const parsedQty = parseFloat(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }

    startTransition(async () => {
      // Offline fallback
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueWastageOffline({
          id: generateUUID(),
          stockItemId: activeItem.id,
          quantity: parsedQty,
          reason: reason as "SPOILED" | "SPILLED" | "DROPPED" | "EXPIRED" | "OTHER",
          notes: notes.trim() || undefined,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        const newQty = Math.max(0, Math.round((activeItem.currentQuantity - parsedQty) * 100) / 100);
        onSuccess(activeItem.id, newQty);
        onClose();
        setQty("1");
        setNotes("");
        return;
      }

      try {
        const res = await logWastage({
          stockItemId: activeItem.id,
          quantity: parsedQty,
          reason: reason as "SPOILED" | "SPILLED" | "DROPPED" | "EXPIRED" | "OTHER",
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          onSuccess(activeItem.id, res.data.newQty);
          onClose();
          setQty("1");
          setNotes("");
        } else {
          setError(res.error);
        }
      } catch {
        await queueWastageOffline({
          id: generateUUID(),
          stockItemId: activeItem.id,
          quantity: parsedQty,
          reason: reason as "SPOILED" | "SPILLED" | "DROPPED" | "EXPIRED" | "OTHER",
          notes: notes.trim() || undefined,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        const newQty = Math.max(0, Math.round((activeItem.currentQuantity - parsedQty) * 100) / 100);
        onSuccess(activeItem.id, newQty);
        onClose();
        setQty("1");
        setNotes("");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Wastage"
      description="Record spoiled, spilled, dropped, or expired items. This automatically reduces stock."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Item Selector */}
        {initialItem ? (
          <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC]">
            <p className="text-xs text-gray-500 font-medium">Selected Item</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {initialItem.name}
            </p>
            <p className="text-xs text-gray-400">
              Current in stock: {initialItem.currentQuantity} {initialItem.unitLabel}
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Select Stock Item
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full py-3 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
            >
              {allItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.category} — {i.name} ({i.currentQuantity} {i.unitLabel})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Quantity Lost ({activeItem?.unitLabel || "unit"})
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              min="0.1"
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 1"
              className="flex-1 py-3 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
            />
            <div className="flex gap-1">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQty(String(n))}
                  className="px-3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reason Dropdown */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Wastage Reason
          </label>
          <select
            value={reason}
            onChange={(e) =>
              setReason(e.target.value as keyof typeof WASTAGE_REASON_LABELS)
            }
            className="w-full py-3 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
          >
            {WASTAGE_REASONS.map((r) => (
              <option key={r} value={r}>
                {WASTAGE_REASON_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Details / Note (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. dropped on floor during rush hour"
            className="w-full py-2.5 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
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
            variant="danger"
            className="flex-1"
            isLoading={isPending}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            <span>Record Wastage</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
