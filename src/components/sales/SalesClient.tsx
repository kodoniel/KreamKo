"use client";

import { useState, useEffect, useTransition } from "react";
import { VariantPickerModal } from "./VariantPickerModal";
import { FlavorToggleModal } from "./FlavorToggleModal";
import { DailyCashCountModal } from "./DailyCashCountModal";
import { PastDaysSalesModal } from "./PastDaysSalesModal";
import { OrderSummaryCart, type CartLineItem } from "./OrderSummaryCart";
import { recordSale } from "@/lib/actions/sales";
import { formatPeso, generateUUID } from "@/lib/utils";
import { cacheMenuProducts, queueSaleOffline } from "@/lib/offline/sync";
import type { PendingSale } from "@/types";
import {
  Search,
  History,
  DollarSign,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  IceCream,
  Coffee,
  Check,
} from "lucide-react";
import type {
  MenuProductWithVariants,
  SaleWithItems,
  DailyCashCountWithUser,
} from "@/types";

interface SalesClientProps {
  initialProducts: MenuProductWithVariants[];
  initialSales: SaleWithItems[];
  initialTotals: { total: number; cash: number; gcash: number; count: number };
  initialCashCount: DailyCashCountWithUser | null;
  isAdmin: boolean;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function SalesClient({
  initialProducts,
  initialSales,
  initialTotals,
  initialCashCount,
  isAdmin,
  currentUser,
}: SalesClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [sales, setSales] = useState(initialSales);
  const [totals, setTotals] = useState(initialTotals);
  const [cashCount, setCashCount] = useState(initialCashCount);

  // Cache products in IndexedDB for offline access
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      cacheMenuProducts(initialProducts);
    }
  }, [initialProducts]);

  // Cart state
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "GCASH">("CASH");
  const [isRecording, startRecording] = useTransition();

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<MenuProductWithVariants | null>(null);
  const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false);
  const [isCashCountOpen, setIsCashCountOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Extract add-ons & dips lists from products for the variant picker
  const addonsProd = products.find((p) => p.category === "Add-ons");
  const dipsProd = products.find((p) => p.category === "Dips");

  const addonsList =
    addonsProd?.variants.map((v) => ({ name: v.name, price: v.price })) || [
      { name: "Sprinkles", price: 5 },
      { name: "Marshmallow", price: 5 },
      { name: "Cookies", price: 5 },
      { name: "Graham", price: 5 },
    ];

  const dipsList =
    dipsProd?.variants.map((v) => ({ name: v.name, price: v.price })) || [
      { name: "Chocolate Dip", price: 8 },
      { name: "Matcha Dip", price: 8 },
    ];

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filtered products
  const filteredProducts = products.filter((prod) => {
    if (!prod.isActive) return false;
    if (selectedCategory !== "ALL" && prod.category !== selectedCategory) return false;
    if (
      search.trim() &&
      !prod.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      !prod.category.toLowerCase().includes(search.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Cart actions
  const handleAddToCart = (line: Omit<CartLineItem, "id">) => {
    setCartItems((prev) => [
      ...prev,
      { ...line, id: crypto.randomUUID() },
    ]);
  };

  const handleUpdateQty = (lineId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === lineId) {
            const newQ = item.quantity + delta;
            if (newQ <= 0) return null;
            return {
              ...item,
              quantity: newQ,
              subtotal: Math.round(item.unitPrice * newQ * 100) / 100,
            };
          }
          return item;
        })
        .filter(Boolean) as CartLineItem[]
    );
  };

  const handleRemoveItem = (lineId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== lineId));
  };

  const handleClearOrder = () => {
    setCartItems([]);
  };

  const handleRecordSale = async (orderNotes?: string): Promise<boolean> => {
    if (cartItems.length === 0) return false;

    const saleId = generateUUID(); // client UUID for offline sync!
    const salePayload = {
      id: saleId,
      paymentMethod,
      notes: orderNotes,
      recordedById: currentUser.id,
      items: cartItems.map((c) => ({
        productId: c.productId,
        variantId: c.variantId,
        productName: c.productName,
        variantName: c.variantName,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        subtotal: c.subtotal,
        addOns: c.addOns,
      })),
    };

    const amount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    const newSaleOptimistic: SaleWithItems = {
      id: saleId,
      paymentMethod: paymentMethod as any,
      totalAmount: amount,
      notes: orderNotes || null,
      saleDate: new Date().toISOString().split("T")[0],
      recordedById: currentUser.id,
      createdAt: new Date(),
      items: salePayload.items.map((it, idx) => ({
        id: `item-${saleId}-${idx}`,
        saleId: saleId,
        productId: it.productId || null,
        variantId: it.variantId || null,
        productName: it.productName,
        variantName: it.variantName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        addOns: (it.addOns as any) || null,
      })),
      recordedBy: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    // If device is offline, write directly to Dexie queue
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const offlineSale: PendingSale = {
        id: saleId,
        paymentMethod,
        totalAmount: amount,
        notes: orderNotes,
        saleDate: new Date().toISOString(),
        recordedById: currentUser.id,
        items: salePayload.items,
        synced: false,
        createdAt: new Date().toISOString(),
      };
      await queueSaleOffline(offlineSale);

      setTotals((prev) => ({
        total: Math.round((prev.total + amount) * 100) / 100,
        cash: paymentMethod === "CASH" ? Math.round((prev.cash + amount) * 100) / 100 : prev.cash,
        gcash: paymentMethod === "GCASH" ? Math.round((prev.gcash + amount) * 100) / 100 : prev.gcash,
        count: prev.count + 1,
      }));

      setSales((prev) => [newSaleOptimistic, ...prev]);
      setCartItems([]);
      setIsMobileCartOpen(false);
      return true;
    }

    return new Promise((resolve) => {
      startRecording(async () => {
        try {
          const res = await recordSale(salePayload);
          if (res.success) {
            // Update local state totals
            const totalAmt = res.data.totalAmount;
            setTotals((prev) => ({
              total: Math.round((prev.total + totalAmt) * 100) / 100,
              cash: paymentMethod === "CASH" ? Math.round((prev.cash + totalAmt) * 100) / 100 : prev.cash,
              gcash: paymentMethod === "GCASH" ? Math.round((prev.gcash + totalAmt) * 100) / 100 : prev.gcash,
              count: prev.count + 1,
            }));

            setSales((prev) => [newSaleOptimistic, ...prev]);
            setCartItems([]);
            setIsMobileCartOpen(false);
            resolve(true);
          } else {
            alert(`Error recording sale: ${res.error}`);
            resolve(false);
          }
        } catch {
          // If server call threw a network error, save offline as fallback
          const offlineSale: PendingSale = {
            id: saleId,
            paymentMethod,
            totalAmount: amount,
            notes: orderNotes,
            saleDate: new Date().toISOString(),
            recordedById: currentUser.id,
            items: salePayload.items,
            synced: false,
            createdAt: new Date().toISOString(),
          };
          await queueSaleOffline(offlineSale);

          setTotals((prev) => ({
            total: Math.round((prev.total + amount) * 100) / 100,
            cash: paymentMethod === "CASH" ? Math.round((prev.cash + amount) * 100) / 100 : prev.cash,
            gcash: paymentMethod === "GCASH" ? Math.round((prev.gcash + amount) * 100) / 100 : prev.gcash,
            count: prev.count + 1,
          }));

          setSales((prev) => [newSaleOptimistic, ...prev]);
          setCartItems([]);
          setIsMobileCartOpen(false);
          resolve(true);
        }
      });
    });
  };

  const handleVariantToggled = (variantId: string, isAvailable: boolean) => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        variants: p.variants.map((v) =>
          v.id === variantId ? { ...v, isAvailable } : v
        ),
      }))
    );
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
            Daily Sales Counter
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">Today:</span>
            <span className="text-xs font-bold text-gray-900 bg-white px-2.5 py-0.5 rounded-full border border-[#E5E1DC]">
              Total: {formatPeso(totals.total)}
            </span>
            <span className="text-xs font-bold text-emerald-900 bg-[#C8F0DE] px-2 py-0.5 rounded-full border border-[#A8E6CF]">
              Cash: {formatPeso(totals.cash)}
            </span>
            <span className="text-xs font-bold text-sky-950 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
              E-Wallet: {formatPeso(totals.gcash)}
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Daily Cash Count button */}
          <button
            type="button"
            onClick={() => setIsCashCountOpen(true)}
            className="py-2.5 px-3.5 rounded-2xl bg-[#FFECC4] hover:bg-[#FFE0A3] active:bg-[#f5c55a] text-amber-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-amber-800" />
            <span>Cash Count</span>
            {cashCount && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            )}
          </button>

          {/* Past Days Sales History */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="py-2.5 px-3.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 border border-[#E5E1DC] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <History className="w-4 h-4 text-gray-500" />
            <span>Past Sales</span>
          </button>

          {/* Admin Flavor / Variant Availability Toggle */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsFlavorModalOpen(true)}
              className="py-2.5 px-3.5 rounded-2xl bg-[#C8F0DE] hover:bg-[#A8E6CF] text-emerald-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
              <span>Flavors Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Counter 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Menu Products Grid (lg:col-span-7 xl:col-span-8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ice cream, floats, fries, hotdog..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E1DC] rounded-2xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2] shadow-2xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-gray-900 text-white shadow-xs"
                  : "bg-white text-gray-600 border border-[#E5E1DC] hover:bg-gray-50"
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#FFB5C2] text-gray-900 border border-[#f5a2b1] shadow-xs"
                    : "bg-white text-gray-600 border border-[#E5E1DC] hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => {
              const lowestPrice = Math.min(...prod.variants.map((v) => v.price));
              const availableCount = prod.variants.filter((v) => v.isAvailable).length;

              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => setSelectedProduct(prod)}
                  className="p-4 rounded-3xl bg-white border border-[#E5E1DC] hover:border-[#FFB5C2] hover:shadow-md active:scale-[0.98] transition-all text-left flex flex-col justify-between min-h-[125px] cursor-pointer group shadow-2xs"
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block truncate mb-1">
                      {prod.category}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#b82e46] transition-colors line-clamp-2">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E5E1DC]/60 flex items-center justify-between">
                    <span className="text-sm font-display font-extrabold text-gray-900">
                      ₱{lowestPrice}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {availableCount} flavor{availableCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Order Cart (Desktop Sticky, lg:col-span-5 xl:col-span-4) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20">
          <OrderSummaryCart
            items={cartItems}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onClearOrder={handleClearOrder}
            onRecordSale={handleRecordSale}
            isRecording={isRecording}
          />
        </div>
      </div>

      {/* Mobile Floating Cart Bar (Sticky at bottom above MobileNav) */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-[68px] inset-x-3 z-30 animate-in slide-in-from-bottom-2 duration-200">
          <div
            onClick={() => setIsMobileCartOpen(true)}
            className="p-3.5 bg-gray-900 text-white rounded-2xl shadow-xl border border-gray-800 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#FFB5C2] text-gray-900 text-xs font-extrabold flex items-center justify-center">
                {cartItemCount}
              </span>
              <span className="text-xs font-bold">View Current Order</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-base text-[#FFB5C2]">
                {formatPeso(cartTotal)}
              </span>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-xl font-bold">
                Open &rarr;
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Full Drawer / Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] bg-white rounded-t-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200">
            <OrderSummaryCart
              items={cartItems}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
              onClearOrder={handleClearOrder}
              onRecordSale={handleRecordSale}
              isRecording={isRecording}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <VariantPickerModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        addonsList={addonsList}
        dipsList={dipsList}
        onAddToCart={handleAddToCart}
      />

      <FlavorToggleModal
        isOpen={isFlavorModalOpen}
        onClose={() => setIsFlavorModalOpen(false)}
        products={products}
        onVariantToggled={handleVariantToggled}
      />

      <DailyCashCountModal
        isOpen={isCashCountOpen}
        onClose={() => setIsCashCountOpen(false)}
        cashSalesToday={totals.cash}
        gcashSalesToday={totals.gcash}
        existingCount={cashCount}
        isAdmin={isAdmin}
        onSuccess={() => {
          // Re-fetch cash count or update local
          window.location.reload();
        }}
      />

      <PastDaysSalesModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        initialSales={sales}
        initialTotals={totals}
      />
    </div>
  );
}

