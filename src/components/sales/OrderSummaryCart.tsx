"use client";

import { useState } from "react";
import { formatPeso } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { SaleAddOn } from "@/types";

export interface CartLineItem {
  id: string; // temp client key
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addOns: SaleAddOn[];
}

interface OrderSummaryCartProps {
  items: CartLineItem[];
  paymentMethod: "CASH" | "GCASH";
  onPaymentMethodChange: (m: "CASH" | "GCASH") => void;
  onUpdateQty: (lineId: string, delta: number) => void;
  onRemoveItem: (lineId: string) => void;
  onClearOrder: () => void;
  onRecordSale: (notes?: string) => Promise<boolean>;
  isRecording: boolean;
}

export function OrderSummaryCart({
  items,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateQty,
  onRemoveItem,
  onClearOrder,
  onRecordSale,
  isRecording,
}: OrderSummaryCartProps) {
  const [notes, setNotes] = useState("");
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleRecord = async () => {
    if (items.length === 0) return;
    const ok = await onRecordSale(notes.trim() || undefined);
    if (ok) {
      setNotes("");
      setShowNotesInput(false);
      setSuccessBanner(`Sale recorded: ${formatPeso(totalAmount)} (${paymentMethod})`);
      setTimeout(() => setSuccessBanner(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E5E1DC] shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E1DC] bg-[#FFFDF9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFD6DE] text-[#b82e46] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">
              Current Sale
            </h2>
            <span className="text-[11px] text-gray-400 font-medium">
              {totalItemCount} item{totalItemCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearOrder}
            className="text-xs text-gray-400 hover:text-red-600 font-semibold p-1 transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="m-3 p-3 rounded-2xl bg-[#C8F0DE] border border-[#A8E6CF] text-emerald-950 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Line Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px] max-h-[380px] lg:max-h-none">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-gray-400">
            <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 opacity-40" />
            <p className="text-xs font-semibold">No items added yet</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Tap any item on the menu to start order
            </p>
          </div>
        ) : (
          items.map((line) => (
            <div
              key={line.id}
              className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC] flex items-center justify-between gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    {line.productName}
                  </h4>
                  <span className="text-[11px] font-semibold text-[#b82e46] shrink-0">
                    ({line.variantName})
                  </span>
                </div>

                {/* Add-ons & dips tags */}
                {line.addOns.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {line.addOns.map((add, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-[#FFECC4] text-amber-900"
                      >
                        +{add.name}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                  {formatPeso(line.unitPrice)} each
                </p>
              </div>

              {/* Quantity Controls & Line Total */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-white border border-[#E5E1DC] rounded-xl p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(line.id, -1)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-gray-900">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(line.id, 1)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right min-w-[55px]">
                  <span className="text-xs font-extrabold text-gray-900 block">
                    {formatPeso(line.subtotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(line.id)}
                  title="Remove item"
                  className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Controls: Total, Payment Method Toggle, Record Sale */}
      <div className="p-4 border-t border-[#E5E1DC] bg-[#FFFDF9] space-y-3">
        {/* Optional Note toggle */}
        {showNotesInput ? (
          <div className="space-y-1">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. less syrup / Customer note"
              className="w-full py-1.5 px-3 text-xs bg-white border border-[#E5E1DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNotesInput(true)}
            className="text-[11px] text-gray-400 hover:text-gray-700 flex items-center gap-1 font-semibold"
          >
            <FileText className="w-3 h-3" />
            <span>+ Add order note</span>
          </button>
        )}

        {/* Big Running Total in ₱ */}
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Total to Pay
          </span>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 leading-tight">
              {formatPeso(totalAmount)}
            </span>
          </div>
        </div>

        {/* Clear Payment Method Toggle (Cash vs GCash, default Cash) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-2xl border border-[#E5E1DC]">
            <button
              type="button"
              onClick={() => onPaymentMethodChange("CASH")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${paymentMethod === "CASH"
                  ? "bg-[#C8F0DE] text-emerald-950 border border-[#A8E6CF] shadow-xs"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <Banknote className="w-4 h-4 text-emerald-700" />
              <span>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => onPaymentMethodChange("GCASH")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${paymentMethod === "GCASH"
                  ? "bg-sky-100 text-sky-950 border border-sky-300 shadow-xs"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <Smartphone className="w-4 h-4 text-sky-700" />
              <span>E-Wallet</span>
            </button>
          </div>
        </div>

        {/* Record Sale Button (Big tap target) */}
        <Button
          type="button"
          size="lg"
          variant="primary"
          disabled={items.length === 0 || isRecording}
          isLoading={isRecording}
          onClick={handleRecord}
          className="w-full text-base font-extrabold py-4 shadow-md bg-[#FFB5C2] hover:bg-[#ffa3b3] active:bg-[#f28e9f]"
        >
          <span>Record Sale ({formatPeso(totalAmount)})</span>
        </Button>
      </div>
    </div>
  );
}

