"use client";

import { useEffect } from "react";
import { HEARTBEAT_INTERVAL_MS } from "./presence";

/**
 * Mounts a heartbeat that POSTs to `/api/auth/heartbeat` every
 * `HEARTBEAT_INTERVAL_MS` while the page is visible.
 *
 * Behavior:
 *   • Fires once immediately on mount so the user lights up right away.
 *   • Pings on a recurring interval (cleared on unmount).
 *   • Pings again whenever the tab becomes visible — handy when the
 *     user comes back after the interval has been throttled by the
 *     browser's background-tab heuristics.
 *   • Silently ignores network errors; the next beat retries.
 *
 * Designed to be safe to mount at the layout level — single instance
 * per page load, no global side effects beyond a small fetch.
 */
export function useHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    async function ping() {
      if (cancelled) return;
      try {
        const res = await fetch("/api/auth/heartbeat", {
          method: "POST",
          cache: "no-store",
          keepalive: true,
        });
        // If the session evaporated server-side (cookie expired, logged
        // out elsewhere, …), fall back to /login with a full reload so
        // the protected layout doesn't keep rendering stale data.
        if (res.status === 401 && typeof window !== "undefined") {
          window.location.assign("/login");
        }
      } catch {
        // Best-effort presence — retried on the next interval.
      }
    }

    ping();
    const id = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
