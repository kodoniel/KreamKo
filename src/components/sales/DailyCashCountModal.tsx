"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { saveDailyCashCount, reopenDailyCashCount } from "@/lib/actions/sales";
import { formatPeso, formatManilaDate, generateUUID } from "@/lib/utils";
import { queueCashCountOffline } from "@/lib/offline/sync";
import { DollarSign, AlertCircle, RefreshCw, CheckCircle2, Lock } from "lucide-react";
import type { DailyCashCountWithUser } from "@/types";

interface DailyCashCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashSalesToday: number;
  gcashSalesToday: number;
  existingCount: DailyCashCountWithUser | null;
  isAdmin: boolean;
  onSuccess: () => void;
}

export function DailyCashCountModal({
  isOpen,
  onClose,
  cashSalesToday,
  gcashSalesToday,
  existingCount,
  isAdmin,
  onSuccess,
}: DailyCashCountModalProps) {
  const isLocked = !!existingCount && !existingCount.isReopened && !isAdmin;
  const isAlreadyCounted = !!existingCount && !existingCount.isReopened;

  const [startingCash, setStartingCash] = useState<string>(
    existingCount ? String(existingCount.startingCash) : "0"
  );
  const [countedCash, setCountedCash] = useState<string>(
    existingCount ? String(existingCount.countedCash) : ""
  );
  const [notes, setNotes] = useState<string>(existingCount?.notes || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedStarting = parseFloat(startingCash) || 0;
  const parsedCounted = parseFloat(countedCash) || 0;

  // Expected Cash = starting cash (change fund) + today's Cash sales
  const expectedCash = Math.round((parsedStarting + cashSalesToday) * 100) / 100;
  const difference = Math.round((parsedCounted - expectedCash) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(parseFloat(countedCash)) || parseFloat(countedCash) < 0) {
      setError("Please enter the cash counted in drawer");
      return;
    }

    startTransition(async () => {
      // Offline fallback
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueCashCountOffline({
          id: generateUUID(),
          countDate: new Date().toISOString(),
          startingCash: parsedStarting,
          countedCash: parsedCounted,
          notes: notes.trim() || undefined,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        alert("Cash count saved offline! It will sync once you reconnect.");
        onSuccess();
        onClose();
        return;
      }

      try {
        const res = await saveDailyCashCount({
          startingCash: parsedStarting,
          countedCash: parsedCounted,
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error);
        }
      } catch {
        await queueCashCountOffline({
          id: generateUUID(),
          countDate: new Date().toISOString(),
          startingCash: parsedStarting,
          countedCash: parsedCounted,
          notes: notes.trim() || undefined,
          synced: false,
          createdAt: new Date().toISOString(),
        });
        onSuccess();
        onClose();
      }
    });
  };

  const handleReopen = () => {
    setError(null);
    startTransition(async () => {
      const res = await reopenDailyCashCount();
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error);
      }
    });
  };

  const todayStr = formatManilaDate(new Date());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Cash Drawer Count"
      description={`End-of-day drawer reconciliation for ${todayStr}.`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Locked state for staff if already submitted */}
        {isAlreadyCounted && (
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-[#E5E1DC] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">
                  Count submitted today
                </p>
                <p className="text-[11px] text-gray-400">
                  Counted by {existingCount.recordedBy?.name || "Staff"}
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleReopen}
                disabled={isPending}
                className="py-1 px-2.5 rounded-xl bg-white border border-[#E5E1DC] hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reopen</span>
              </button>
            )}
          </div>
        )}

        {/* Sales Reference Box */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#FFFDF9] border border-[#E5E1DC]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Cash Sales Today
            </span>
            <span className="text-base font-display font-extrabold text-gray-900 block mt-0.5">
              {formatPeso(cashSalesToday)}
            </span>
            <span className="text-[10px] text-gray-400">counted in drawer</span>
          </div>

          <div className="border-l border-[#E5E1DC] pl-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
              E-Wallet Sales Today
            </span>
            <span className="text-base font-display font-extrabold text-sky-900 block mt-0.5">
              {formatPeso(gcashSalesToday)}
            </span>
            <span className="text-[10px] text-sky-600">e-wallet (not in drawer)</span>
          </div>
        </div>

        {/* Starting Cash (Change Fund) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Starting Cash / Change Fund (₱)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            disabled={isLocked}
            value={startingCash}
            onChange={(e) => setStartingCash(e.target.value)}
            placeholder="e.g. 1000.00"
            className="w-full py-2.5 px-3.5 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2] disabled:opacity-60"
          />
        </div>

        {/* Counted Cash in Drawer */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Actual Cash Counted in Drawer (₱)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            required
            disabled={isLocked}
            value={countedCash}
            onChange={(e) => setCountedCash(e.target.value)}
            placeholder="e.g. 4100.00"
            className="w-full py-3 px-4 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2] disabled:opacity-60"
          />
        </div>

        {/* Calculation & Difference Output */}
        {countedCash !== "" && (
          <div className="p-4 rounded-2xl bg-white border border-[#E5E1DC] space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Expected in Drawer (Starting + Cash Sales):</span>
              <strong className="font-bold text-gray-800">
                {formatPeso(expectedCash)}
              </strong>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Actual Cash Counted:</span>
              <strong className="font-bold text-gray-800">
                {formatPeso(parsedCounted)}
              </strong>
            </div>

            <div className="pt-2 border-t border-[#E5E1DC] flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Reconciliation:</span>
              {difference === 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#C8F0DE] text-emerald-950">
                  Exact Match (₱0.00)
                </span>
              ) : difference > 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#C8F0DE] text-emerald-950">
                  Over +{formatPeso(difference)}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFD6DE] text-[#b82e46]">
                  Short -{formatPeso(Math.abs(difference))}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Closing Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Closing Note (Optional)
          </label>
          <input
            type="text"
            disabled={isLocked}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. short ₱10 due to missing 1 coin"
            className="w-full py-2.5 px-3.5 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2] disabled:opacity-60"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2 border-t border-[#E5E1DC]">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Close
          </Button>
          {!isLocked && (
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isPending}
            >
              <DollarSign className="w-4 h-4 mr-1.5" />
              <span>Submit Cash Count</span>
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

