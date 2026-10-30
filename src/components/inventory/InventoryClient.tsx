"use client";

import { useState, useEffect } from "react";
import { StockItemCard } from "./StockItemCard";
import { RestockModal } from "./RestockModal";
import { WastageModal } from "./WastageModal";
import { ShoppingListModal } from "./ShoppingListModal";
import { EndOfDayStockModal } from "./EndOfDayStockModal";
import { AddEditItemModal } from "./AddEditItemModal";
import { Button } from "@/components/ui/Button";
import {
  Search,
  ShoppingCart,
  Trash2,
  ClipboardCheck,
  Plus,
  History,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import { formatManilaDateTime } from "@/lib/utils";
import { cacheStockItems } from "@/lib/offline/sync";
import type { StockItem } from "@prisma/client";

interface InventoryClientProps {
  initialItems: StockItem[];
  isAdmin: boolean;
  initialLogs?: {
    id: string;
    stockItemId: string;
    changeDelta: number;
    beforeQty: number;
    afterQty: number;
    reason: string;
    notes?: string | null;
    createdAt: Date | string;
    stockItem: { name: string; unitLabel: string };
    user?: { name: string } | null;
  }[];
}

export function InventoryClient({
  initialItems,
  isAdmin,
  initialLogs = [],
}: InventoryClientProps) {
  const [items, setItems] = useState<StockItem[]>(initialItems);
  const [logs, setLogs] = useState(initialLogs);

  // Cache items in IndexedDB for offline access
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      cacheStockItems(initialItems);
    }
  }, [initialItems]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "logs">("items");

  // Modals state
  const [restockItem, setRestockItem] = useState<StockItem | null>(null);
  const [wastageItem, setWastageItem] = useState<StockItem | null>(null);
  const [isWastageOpen, setIsWastageOpen] = useState(false);
  const [isShoppingOpen, setIsShoppingOpen] = useState(false);
  const [isEODOpen, setIsEODOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);

  // Categories list
  const categories = Array.from(new Set(items.map((i) => i.category)));

  // Low stock counts
  const lowStockCount = items.filter(
    (i) => i.isActive && i.currentQuantity <= i.lowStockLevel
  ).length;

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (!item.isActive) return false;
    if (lowStockOnly && item.currentQuantity > item.lowStockLevel) return false;
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (
      search.trim() &&
      !item.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      !item.category.toLowerCase().includes(search.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleQtyUpdated = (itemId: string, newQty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, currentQuantity: newQty } : i))
    );
  };

  const handleEODSuccess = (updated: { id: string; newQty: number }[]) => {
    const map = new Map(updated.map((u) => [u.id, u.newQty]));
    setItems((prev) =>
      prev.map((i) =>
        map.has(i.id) ? { ...i, currentQuantity: map.get(i.id)! } : i
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
            Stock Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track packs, ingredients, supplies, wastage, and closing counts.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* What to buy (Shopping List MVP) */}
          <button
            type="button"
            onClick={() => setIsShoppingOpen(true)}
            className="py-2.5 px-3.5 rounded-2xl bg-[#FFECC4] hover:bg-[#FFE0A3] active:bg-[#f5c55a] text-amber-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-amber-800" />
            <span>What to buy</span>
            {lowStockCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] flex items-center justify-center font-bold">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Quick Log Wastage */}
          <button
            type="button"
            onClick={() => {
              setWastageItem(null);
              setIsWastageOpen(true);
            }}
            className="py-2.5 px-3.5 rounded-2xl bg-white hover:bg-[#FFD6DE]/50 active:bg-[#FFD6DE] text-gray-800 hover:text-[#b82e46] border border-[#E5E1DC] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-[#b82e46]" />
            <span>Log Wastage</span>
          </button>

          {/* End-of-Day Count */}
          <button
            type="button"
            onClick={() => setIsEODOpen(true)}
            className="py-2.5 px-3.5 rounded-2xl bg-[#C8F0DE] hover:bg-[#A8E6CF] active:bg-[#7bcba8] text-emerald-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-800" />
            <span>EOD Count</span>
          </button>

          {/* Admin Add Item */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditItem(null);
                setIsAddEditOpen(true);
              }}
              className="py-2.5 px-3.5 rounded-2xl bg-[#FFB5C2] hover:bg-[#ffa3b3] active:bg-[#f28e9f] text-gray-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Items vs Audit Log */}
      <div className="flex items-center gap-2 border-b border-[#E5E1DC] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "items"
              ? "bg-white text-gray-900 shadow-xs border border-[#E5E1DC]"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventory Items ({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "logs"
              ? "bg-white text-gray-900 shadow-xs border border-[#E5E1DC]"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log ({logs.length})</span>
        </button>
      </div>

      {activeTab === "items" ? (
        <>
          {/* Search bar & Low stock toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ingredient, pack name, or category..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E1DC] rounded-2xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2] shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Low stock only filter */}
            <button
              type="button"
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer shrink-0 ${
                lowStockOnly
                  ? "bg-[#FFECC4] border-[#FFE0A3] text-amber-950 shadow-xs"
                  : "bg-white border-[#E5E1DC] text-gray-600 hover:bg-gray-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Low Stock Only ({lowStockCount})</span>
            </button>
          </div>

          {/* Category Horizontal Filter Pills */}
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
              All Categories ({items.length})
            </button>
            {categories.map((cat) => {
              const count = items.filter(
                (i) => i.isActive && i.category === cat
              ).length;
              return (
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
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Stock Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E1DC] p-8">
              <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">
                No items match your filter
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Try searching for something else or clear the category / low-stock filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("ALL");
                  setLowStockOnly(false);
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <StockItemCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onOpenRestock={(it) => setRestockItem(it)}
                  onOpenWastage={(it) => {
                    setWastageItem(it);
                    setIsWastageOpen(true);
                  }}
                  onOpenEdit={(it) => {
                    setEditItem(it);
                    setIsAddEditOpen(true);
                  }}
                  onQtyUpdated={handleQtyUpdated}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Audit Log Table */
        <div className="bg-white rounded-3xl border border-[#E5E1DC] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E5E1DC] bg-[#FFFDF9] flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Recent Stock Activity & Audit Trail
            </h3>
            <span className="text-xs text-gray-400">
              Last {logs.length} changes
            </span>
          </div>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No stock logs recorded yet. Adjustments, restocks, and wastage will appear here.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E1DC] max-h-[65vh] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {log.stockItem?.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatManilaDateTime(log.createdAt)} • by{" "}
                      <strong>{log.user?.name || "Counter Staff"}</strong>
                    </p>
                    {log.notes && (
                      <p className="text-[11px] text-gray-500 italic mt-0.5">
                        &quot;{log.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block font-bold px-2 py-0.5 rounded-lg text-xs ${
                        log.changeDelta > 0
                          ? "bg-[#C8F0DE] text-emerald-900"
                          : "bg-[#FFD6DE] text-[#b82e46]"
                      }`}
                    >
                      {log.changeDelta > 0 ? `+${log.changeDelta}` : log.changeDelta}{" "}
                      {log.stockItem?.unitLabel}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {log.beforeQty} &rarr; <strong>{log.afterQty}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <RestockModal
        isOpen={!!restockItem}
        onClose={() => setRestockItem(null)}
        item={restockItem}
        isAdmin={isAdmin}
        onSuccess={handleQtyUpdated}
      />

      <WastageModal
        isOpen={isWastageOpen}
        onClose={() => {
          setIsWastageOpen(false);
          setWastageItem(null);
        }}
        item={wastageItem}
        allItems={items}
        onSuccess={handleQtyUpdated}
      />

      <ShoppingListModal
        isOpen={isShoppingOpen}
        onClose={() => setIsShoppingOpen(false)}
        items={items}
      />

      <EndOfDayStockModal
        isOpen={isEODOpen}
        onClose={() => setIsEODOpen(false)}
        items={items}
        onSuccess={handleEODSuccess}
      />

      <AddEditItemModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditItem(null);
        }}
        itemToEdit={editItem}
        onSuccess={() => {
          // Refreshes the page to pick up changes
          window.location.reload();
        }}
      />
    </div>
  );
}

