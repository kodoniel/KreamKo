"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { restockItem } from "@/lib/actions/inventory";
import { formatPeso, generateUUID } from "@/lib/utils";
import { queueStockChangeOffline } from "@/lib/offline/sync";
import { PackagePlus, AlertCircle } from "lucide-react";
import type { StockItem } from "@prisma/client";

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
  isAdmin: boolean;
  onSuccess: (itemId: string, newQty: number) => void;
}

export function RestockModal({
  isOpen,
  onClose,
  item,
  isAdmin,
  onSuccess,
}: RestockModalProps) {
  const [qty, setQty] = useState<string>("1");
  const [cost, setCost] = useState<string>(item?.costPrice ? String(item.costPrice) : "");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedQty = parseFloat(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }

    const parsedCost = cost ? parseFloat(cost) : undefined;

    startTransition(async () => {
      // Offline fallback
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueStockChangeOffline({
          id: generateUUID(),
          stockItemId: item.id,
          changeDelta: parsedQty,
          reason: "RESTOCK",
          notes: notes.trim() || undefined,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        const newQty = Math.round((item.currentQuantity + parsedQty) * 100) / 100;
        onSuccess(item.id, newQty);
        onClose();
        setQty("1");
        setNotes("");
        return;
      }

      try {
        const res = await restockItem({
          stockItemId: item.id,
          quantityAdded: parsedQty,
          costPrice: parsedCost,
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          onSuccess(item.id, res.data.newQty);
          onClose();
          setQty("1");
          setNotes("");
        } else {
          setError(res.error);
        }
      } catch {
        await queueStockChangeOffline({
          id: generateUUID(),
          stockItemId: item.id,
          changeDelta: parsedQty,
          reason: "RESTOCK",
          notes: notes.trim() || undefined,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        const newQty = Math.round((item.currentQuantity + parsedQty) * 100) / 100;
        onSuccess(item.id, newQty);
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
      title={`Restock: ${item.name}`}
      description={`Current: ${item.currentQuantity} ${item.unitLabel}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quantity Added */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Quantity to Add ({item.unitLabel})
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              min="0.1"
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 5"
              className="flex-1 py-3 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
            />
            {/* Quick increment buttons */}
            <div className="flex gap-1">
              {[1, 2, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQty(String(n))}
                  className="px-2.5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            New total will be:{" "}
            <strong>
              {Math.round(((item.currentQuantity || 0) + (parseFloat(qty) || 0)) * 100) / 100}{" "}
              {item.unitLabel}
            </strong>
          </p>
        </div>

        {/* Cost Price (Admin only) */}
        {isAdmin && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Unit Cost Price (₱, Optional)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="e.g. 150.00"
              className="w-full py-3 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Used for estimated profit and cost reporting (Admin only).
            </p>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Note (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Bought from market / new delivery"
            className="w-full py-2.5 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
          />
        </div>

        {/* Buttons */}
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
            variant="primary"
            className="flex-1"
            isLoading={isPending}
          >
            <PackagePlus className="w-4 h-4 mr-1.5" />
            <span>Confirm Restock</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

