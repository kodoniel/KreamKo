"use client";

import { useSync } from "@/hooks/useSync";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export interface SyncBadgeProps {
  pendingCount?: number;
  isSyncing?: boolean;
}

export function SyncBadge(props: SyncBadgeProps) {
  const syncState = useSync();

  const isOnline = syncState.isOnline;
  const isSyncing = props.isSyncing ?? syncState.isSyncing;
  const pendingCount = props.pendingCount ?? syncState.pendingCount;

  if (!isOnline) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFECC4] border border-[#FFE0A3] text-amber-900 text-xs font-bold shadow-xs select-none"
        title="App is working offline. All sales and counts are saved locally and will auto-sync when online."
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-700" />
        <span>Offline</span>
        {pendingCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C8F0DE] border border-[#A8E6CF] text-emerald-900 text-xs font-bold shadow-xs select-none">
        <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (pendingCount > 0) {
          syncState.triggerSync();
        }
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs select-none transition-all cursor-pointer ${
        pendingCount > 0
          ? "bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900"
          : "bg-[#C8F0DE]/60 border border-[#A8E6CF]/70 text-emerald-900 hover:bg-[#C8F0DE]"
      }`}
      title={
        pendingCount > 0
          ? `${pendingCount} offline change(s) waiting to sync. Click to sync now.`
          : "Connected to server. All data synced."
      }
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            pendingCount > 0 ? "bg-amber-400" : "bg-emerald-400"
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            pendingCount > 0 ? "bg-amber-500" : "bg-emerald-500"
          }`}
        />
      </span>
      <span className="hidden sm:inline">Online</span>
      {pendingCount > 0 ? (
        <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
          {pendingCount} to sync
        </span>
      ) : (
        <span className="text-[10px] text-emerald-700 hidden md:inline">Synced</span>
      )}
    </button>
  );
}
