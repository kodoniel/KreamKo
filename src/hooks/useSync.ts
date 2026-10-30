"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getPendingItemsCount,
  syncAllPendingQueue,
  SYNC_STATUS_EVENT,
} from "@/lib/offline/sync";

export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingItemsCount();
    setPendingCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setIsSyncing(true);
    await syncAllPendingQueue();
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleSyncStatus = (event: Event) => {
      const custom = event as CustomEvent<{
        isSyncing: boolean;
        pendingCount: number;
      }>;
      if (custom.detail) {
        setIsSyncing(custom.detail.isSyncing);
        setPendingCount(custom.detail.pendingCount);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(SYNC_STATUS_EVENT, handleSyncStatus);

    // Initial sync if online and pending items exist
    if (navigator.onLine) {
      triggerSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(SYNC_STATUS_EVENT, handleSyncStatus);
    };
  }, [refreshPendingCount, triggerSync]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    triggerSync,
  };
}

