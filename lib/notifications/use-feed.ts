"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  actor: { id: string | null; name: string; role: string };
  createdAt: string;
  read: boolean;
  scope: "user" | "role";
}

interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export interface NotificationsFeed {
  items: NotificationItem[];
  loading: boolean;
  error: string | null;
  /** Number of unread notifications visible to the current user. */
  unreadCount: number;
  /** True while the SSE channel is open. */
  live: boolean;
  /** Mark every visible notification as read on the server + locally. */
  markAllRead: () => Promise<void>;
  /** Mark a single notification as read (no-op if already read). */
  markRead: (id: string) => Promise<void>;
  /** Re-fetch the feed (useful when opening the popover). */
  refresh: () => void;
  /** True once authenticated (every signed-in user has a feed). */
  enabled: boolean;
}

/** Hard cap on how many notifications we keep in memory. */
const FEED_LIMIT = 50;

/** Merge new items into the existing list, dedupe by _id, newest first. */
function mergeItems(
  prev: NotificationItem[],
  incoming: NotificationItem[]
): NotificationItem[] {
  if (incoming.length === 0) return prev;
  const map = new Map<string, NotificationItem>();
  // Incoming wins on duplicates (server-side `read` may have changed).
  for (const it of [...prev, ...incoming]) {
    map.set(it._id, it);
  }
  return Array.from(map.values())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, FEED_LIMIT);
}

/**
 * Shared notifications feed used by both the sidebar badge and the
 * notifications popover.
 *
 * Data flow
 * ─────────
 * 1. Initial REST snapshot via `GET /api/notifications`.
 * 2. Live updates pushed by SSE via `GET /api/notifications/stream`.
 *    EventSource auto-reconnects on disconnect, so we only treat
 *    `onerror` as a transient signal (flip `live=false` then back to
 *    true once it recovers).
 * 3. Read state is server-tracked (per recipient). The hook simply
 *    POSTs to `/api/notifications/read-all` or `PATCH /[id]` and
 *    optimistically updates the in-memory items.
 */
export function useNotificationsFeed(): NotificationsFeed {
  const { user } = useCurrentUser();
  const enabled = Boolean(user.id);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const recomputeUnread = useCallback(
    (next: NotificationItem[]) =>
      next.reduce((acc, it) => (it.read ? acc : acc + 1), 0),
    []
  );

  const fetchFeed = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    fetch("/api/notifications?limit=50", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()) as NotificationsResponse;
      })
      .then((data) => {
        const incoming = Array.isArray(data?.items) ? data.items : [];
        setItems(incoming);
        setUnreadCount(
          typeof data?.unreadCount === "number"
            ? data.unreadCount
            : recomputeUnread(incoming)
        );
      })
      .catch(() => {
        setError("Impossible de charger les notifications.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [enabled, recomputeUnread]);

  // Initial snapshot whenever the user changes.
  useEffect(() => {
    if (!enabled) return;
    fetchFeed();
  }, [enabled, fetchFeed, user.id]);

  // Open the SSE channel and merge incoming events.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    const handleConnected = () => setLive(true);
    const handleHeartbeat = () => setLive(true);
    const handleNotifications = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data) as { items?: NotificationItem[] };
        const incoming = Array.isArray(data?.items) ? data.items : [];
        if (incoming.length > 0) {
          setItems((prev) => {
            const merged = mergeItems(prev, incoming);
            setUnreadCount(recomputeUnread(merged));
            return merged;
          });
        }
        setLive(true);
      } catch {
        // ignore malformed payloads
      }
    };
    const handleError = () => {
      // EventSource reconnects automatically — just flag the UI.
      setLive(false);
    };

    es.addEventListener("connected", handleConnected);
    es.addEventListener("heartbeat", handleHeartbeat);
    es.addEventListener("notifications", handleNotifications);
    es.addEventListener("error", handleError);

    return () => {
      es.removeEventListener("connected", handleConnected);
      es.removeEventListener("heartbeat", handleHeartbeat);
      es.removeEventListener("notifications", handleNotifications);
      es.removeEventListener("error", handleError);
      es.close();
      esRef.current = null;
      setLive(false);
    };
  }, [enabled, recomputeUnread, user.id]);

  const markAllRead = useCallback(async () => {
    // Optimistic update first.
    setItems((prev) => {
      const next = prev.map((it) => ({ ...it, read: true }));
      setUnreadCount(0);
      return next;
    });
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      // If it fails we'll re-sync on the next SSE tick / refresh.
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        if (it._id === id && !it.read) {
          changed = true;
          return { ...it, read: true };
        }
        return it;
      });
      if (changed) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return next;
    });
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch {
      // Ignore — server will re-sync via SSE.
    }
  }, []);

  return {
    items,
    loading,
    error,
    unreadCount,
    live,
    markAllRead,
    markRead,
    refresh: fetchFeed,
    enabled,
  };
}
