"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { addStockItem, updateStockItem, archiveStockItem } from "@/lib/actions/inventory";
import { STOCK_CATEGORIES, DEFAULT_UNIT_LABELS } from "@/lib/constants";
import { AlertCircle, Archive, Plus, Save } from "lucide-react";
import type { StockItem } from "@prisma/client";

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: StockItem | null;
  onSuccess: () => void;
}

export function AddEditItemModal({
  isOpen,
  onClose,
  itemToEdit,
  onSuccess,
}: AddEditItemModalProps) {
  const isEditing = !!itemToEdit;

  const [name, setName] = useState(itemToEdit?.name || "");
  const [category, setCategory] = useState(itemToEdit?.category || STOCK_CATEGORIES[0]);
  const [unitLabel, setUnitLabel] = useState(itemToEdit?.unitLabel || "pack");
  const [currentQty, setCurrentQty] = useState(itemToEdit ? String(itemToEdit.currentQuantity) : "0");
  const [lowStock, setLowStock] = useState(itemToEdit ? String(itemToEdit.lowStockLevel) : "2");
  const [costPrice, setCostPrice] = useState(itemToEdit?.costPrice ? String(itemToEdit.costPrice) : "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedLow = parseFloat(lowStock);
    const parsedCost = costPrice ? parseFloat(costPrice) : null;

    startTransition(async () => {
      if (isEditing && itemToEdit) {
        const res = await updateStockItem(itemToEdit.id, {
          name,
          category,
          unitLabel,
          lowStockLevel: isNaN(parsedLow) ? 2 : parsedLow,
          costPrice: parsedCost,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error);
        }
      } else {
        const parsedQty = parseFloat(currentQty);
        const res = await addStockItem({
          name,
          category,
          unitLabel,
          currentQuantity: isNaN(parsedQty) ? 0 : parsedQty,
          lowStockLevel: isNaN(parsedLow) ? 2 : parsedLow,
          costPrice: parsedCost,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error);
        }
      }
    });
  };

  const handleArchive = () => {
    if (!itemToEdit) return;
    if (!confirm(`Are you sure you want to archive "${itemToEdit.name}"? It will be hidden from staff inventory.`)) {
      return;
    }

    startTransition(async () => {
      const res = await archiveStockItem(itemToEdit.id);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit: ${itemToEdit?.name}` : "Add New Stock Item"}
      description="Stock items represent supplies and ingredients you purchase for the stall."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Item Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Item Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Avocado Ice Cream Powder"
            className="w-full py-3 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
          />
        </div>

        {/* Category & Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-3 px-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
            >
              {STOCK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Unit Label
            </label>
            <select
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              className="w-full py-3 px-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
            >
              {DEFAULT_UNIT_LABELS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-2 gap-3">
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Starting Stock
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={currentQty}
                onChange={(e) => setCurrentQty(e.target.value)}
                placeholder="0"
                className="w-full py-2.5 px-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
              />
            </div>
          )}

          <div className={isEditing ? "col-span-2" : ""}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Low-Stock Alert Level
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={lowStock}
              onChange={(e) => setLowStock(e.target.value)}
              placeholder="2"
              className="w-full py-2.5 px-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Triggers warning badge and &quot;What to buy&quot; suggestion when at or below this count.
            </p>
          </div>
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Cost Price per {unitLabel} (₱, Optional)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="e.g. 180.00"
            className="w-full py-2.5 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5E1DC]">
          {isEditing ? (
            <button
              type="button"
              onClick={handleArchive}
              disabled={isPending}
              className="py-2.5 px-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isPending}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  <span>Add Item</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

