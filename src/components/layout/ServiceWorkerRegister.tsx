"use client";

import { useEffect } from "react";

/**
 * Registers the Service Worker on mount for PWA capabilities
 * and offline caching of assets and app shell.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Kream Ko Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("Kream Ko Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}

