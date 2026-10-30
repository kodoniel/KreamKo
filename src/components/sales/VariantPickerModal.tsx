"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatPeso } from "@/lib/utils";
import { Plus, Minus, Check, AlertCircle } from "lucide-react";
import type { MenuProductWithVariants, SaleAddOn } from "@/types";

interface VariantPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MenuProductWithVariants | null;
  addonsList: { name: string; price: number }[];
  dipsList: { name: string; price: number }[];
  onAddToCart: (item: {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    addOns: SaleAddOn[];
  }) => void;
}

export function VariantPickerModal({
  isOpen,
  onClose,
  product,
  addonsList,
  dipsList,
  onAddToCart,
}: VariantPickerModalProps) {
  if (!product) return null;

  // Selected variant (default to first available variant)
  const availableVariants = product.variants.filter((v) => v.isAvailable && v.isActive);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    availableVariants[0]?.id || product.variants[0]?.id || ""
  );

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [selectedDips, setSelectedDips] = useState<Record<string, boolean>>({});

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  // Compute pricing
  const variantPrice = selectedVariant?.price || 0;

  const totalAddonsPrice = Object.entries(selectedAddons).reduce(
    (sum, [name, isSelected]) => {
      if (!isSelected) return sum;
      const add = addonsList.find((a) => a.name === name);
      return sum + (add?.price || 0);
    },
    0
  );

  const totalDipsPrice = Object.entries(selectedDips).reduce(
    (sum, [name, isSelected]) => {
      if (!isSelected) return sum;
      const dip = dipsList.find((d) => d.name === name);
      return sum + (dip?.price || 0);
    },
    0
  );

  const singleItemPrice = variantPrice + totalAddonsPrice + totalDipsPrice;
  const lineItemTotal = singleItemPrice * quantity;

  const handleToggleAddon = (name: string) => {
    setSelectedAddons((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleToggleDip = (name: string) => {
    setSelectedDips((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleConfirm = () => {
    if (!selectedVariant) return;

    const addons: SaleAddOn[] = [];

    // Add selected toppings
    for (const [name, isSelected] of Object.entries(selectedAddons)) {
      if (isSelected) {
        const found = addonsList.find((a) => a.name === name);
        if (found) addons.push({ name, price: found.price, quantity: 1 });
      }
    }

    // Add selected dips
    for (const [name, isSelected] of Object.entries(selectedDips)) {
      if (isSelected) {
        const found = dipsList.find((d) => d.name === name);
        if (found) addons.push({ name, price: found.price, quantity: 1 });
      }
    }

    onAddToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      quantity,
      unitPrice: singleItemPrice,
      subtotal: lineItemTotal,
      addOns: addons,
    });

    // Reset & close
    setQuantity(1);
    setSelectedAddons({});
    setSelectedDips({});
    onClose();
  };

  const isIceCreamOrSundae =
    product.category === "Ice Cream" ||
    product.category === "Sundae" ||
    product.category === "Ice Cream Tub";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      description={`Select flavor/size and optional add-ons.`}
      className="max-w-lg"
    >
      <div className="space-y-4">
        {/* Variants selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Choose Flavor / Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            {product.variants.map((v) => {
              const isSelected = v.id === selectedVariantId;
              const isAvailable = v.isAvailable;

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#FFF8F0] border-[#FFB5C2] ring-2 ring-[#FFB5C2] shadow-xs"
                      : isAvailable
                      ? "bg-white border-[#E5E1DC] hover:border-gray-300"
                      : "bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 block truncate">
                      {v.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#b82e46] shrink-0" />
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-[#b82e46] block mt-0.5">
                    {formatPeso(v.price)}
                  </span>
                  {!isAvailable && (
                    <span className="text-[10px] text-gray-500 font-semibold uppercase block mt-0.5">
                      Unavailable today
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Add-ons & Dips (if applicable) */}
        {isIceCreamOrSundae && addonsList.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Add-ons (+₱5 each)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {addonsList.map((addon) => {
                const checked = !!selectedAddons[addon.name];
                return (
                  <button
                    key={addon.name}
                    type="button"
                    onClick={() => handleToggleAddon(addon.name)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      checked
                        ? "bg-[#C8F0DE] border-[#A8E6CF] text-emerald-950 shadow-2xs"
                        : "bg-white border-[#E5E1DC] text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{addon.name}</span>
                    <span className="text-[10px] opacity-70">
                      +{addon.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isIceCreamOrSundae && dipsList.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Dips (+₱8 each)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {dipsList.map((dip) => {
                const checked = !!selectedDips[dip.name];
                return (
                  <button
                    key={dip.name}
                    type="button"
                    onClick={() => handleToggleDip(dip.name)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      checked
                        ? "bg-[#FFECC4] border-[#FFE0A3] text-amber-950 shadow-2xs"
                        : "bg-white border-[#E5E1DC] text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{dip.name}</span>
                    <span className="text-[10px] opacity-70">+{dip.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl p-1">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 border border-[#E5E1DC] disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="w-14 text-center font-bold text-lg text-gray-900 bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 border border-[#E5E1DC] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-1.5">
              {[1, 2, 3, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    quantity === n
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Total & Action */}
        <div className="pt-3 border-t border-[#E5E1DC] flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">
              Line Total ({quantity} × {formatPeso(singleItemPrice)})
            </span>
            <span className="text-xl font-display font-extrabold text-gray-900 block leading-tight">
              {formatPeso(lineItemTotal)}
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!selectedVariant || !selectedVariant.isAvailable}
              onClick={handleConfirm}
              className="px-6 font-bold"
            >
              Add to Order
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

