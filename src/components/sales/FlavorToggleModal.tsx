"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toggleVariantAvailability } from "@/lib/actions/sales";
import { Check, X, Sparkles, AlertCircle } from "lucide-react";
import type { MenuProductWithVariants } from "@/types";

interface FlavorToggleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MenuProductWithVariants[];
  onVariantToggled: (variantId: string, isAvailable: boolean) => void;
}

export function FlavorToggleModal({
  isOpen,
  onClose,
  products,
  onVariantToggled,
}: FlavorToggleModalProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleToggle = (variantId: string, currentAvailable: boolean) => {
    setError(null);
    setUpdatingId(variantId);

    const nextState = !currentAvailable;

    startTransition(async () => {
      const res = await toggleVariantAvailability(variantId, nextState);
      setUpdatingId(null);

      if (res.success) {
        onVariantToggled(variantId, nextState);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Flavor & Variant Availability"
      description="Toggle flavors or sizes on/off based on what you have prepped or in stock today."
      className="max-w-xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
          {products.map((prod) => (
            <div key={prod.id} className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                {prod.name} ({prod.category})
              </h4>
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E5E1DC] divide-y divide-[#E5E1DC]">
                {prod.variants.map((v) => {
                  const isBusy = updatingId === v.id;
                  return (
                    <div
                      key={v.id}
                      className="p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-xs font-bold text-gray-900">
                          {v.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          ₱{v.price}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggle(v.id, v.isAvailable)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          v.isAvailable
                            ? "bg-[#C8F0DE] text-emerald-950 border border-[#A8E6CF]"
                            : "bg-[#FFD6DE] text-[#b82e46] border border-[#FFB5C2]"
                        }`}
                      >
                        {v.isAvailable ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Available</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-[#b82e46]" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#E5E1DC] flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

