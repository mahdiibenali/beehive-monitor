"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, X } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type {
  NotificationItem,
  NotificationsFeed,
} from "@/lib/notifications/use-feed";
import { getNotificationRoute } from "@/lib/notifications/route";

interface NotificationsPopoverProps {
  open: boolean;
  onClose: () => void;
  /** Shared feed (data, unread count, mark-read helpers). */
  feed: NotificationsFeed;
}

/** Localised "time ago" using the user's locale. */
function timeAgo(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor((now - t) / 1000));
  if (seconds < 45) return "À l'instant";
  if (seconds < 90) return "Il y a 1 minute";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

/** Map a notification type to the icon tone bubble. */
function toneFor(type: NotificationItem["type"]): {
  bg: string;
  fg: string;
} {
  switch (type) {
    case "success":
      return { bg: "bg-primary-50", fg: "text-brand-purple" };
    case "warning":
      return { bg: "bg-accent-50", fg: "text-brand-orange" };
    case "error":
      return { bg: "bg-[#FEE4E4]", fg: "text-danger" };
    default:
      return { bg: "bg-ink-100", fg: "text-ink-600" };
  }
}

/**
 * Floating notifications panel anchored to the bottom-left of the screen
 * (just above the sidebar's Notifications button). Mobile (<lg) renders
 * as a bottom-sheet — same pattern as `UserProfilePopover`.
 */
export function NotificationsPopover({
  open,
  onClose,
  feed,
}: NotificationsPopoverProps) {
  const router = useRouter();
  const {
    items,
    loading,
    error,
    unreadCount,
    live,
    markAllRead,
    markRead,
    refresh,
    enabled,
  } = feed;

  // Refresh the feed each time the popover opens.
  useEffect(() => {
    if (open && enabled) refresh();
  }, [open, enabled, refresh]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const empty = useMemo(
    () => !loading && !error && items.length === 0,
    [loading, error, items.length]
  );

  if (!open) return null;

  function handleRowClick(item: NotificationItem) {
    if (!item.read) {
      void markRead(item._id);
    }
    // Explicit link wins; otherwise we infer a deep-link from
    // (entity, entityId) — e.g. maintenance.<id> → /maintenance?open=<id>.
    const dest = getNotificationRoute({
      link: item.link,
      entity: item.entity,
      entityId: item.entityId,
    });
    if (dest) {
      router.push(dest);
      onClose();
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cn(
          "animate-fade-in-up fixed z-50 flex flex-col rounded-[24px] bg-white shadow-pop",
          // Mobile placement & sizing — bottom sheet
          "inset-x-4 bottom-4 max-h-[calc(100vh-2rem)]",
          // Desktop placement — anchored above the Notifications button
          "lg:inset-x-auto lg:bottom-24 lg:left-[260px] lg:right-auto lg:w-[380px] lg:max-h-[520px]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-brand-purple">
              <Bell className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-ink-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-orange px-1.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
            {enabled && (
              <span
                className="ml-1 inline-flex items-center gap-1 text-[10px] font-medium text-ink-400"
                title={live ? "Connecté en direct" : "Reconnexion…"}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    live ? "bg-success animate-pulse" : "bg-ink-300"
                  )}
                  aria-hidden
                />
                {live ? "En direct" : "Hors ligne"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-brand-purple"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Mark all as read */}
        {enabled && unreadCount > 0 && (
          <div className="flex items-center justify-end border-b border-ink-100 px-5 py-2">
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-xs font-semibold text-brand-purple transition-colors hover:text-brand-purple-pressed"
            >
              Tout marquer comme lu
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {!enabled && (
            <EmptyState message="Aucune notification pour le moment." />
          )}

          {enabled && loading && items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ink-500">
              Chargement…
            </p>
          )}

          {enabled && error && items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-brand-orange">
              {error}
            </p>
          )}

          {enabled && empty && (
            <EmptyState message="Aucune notification pour le moment." />
          )}

          {enabled && items.length > 0 && (
            <ul className="divide-y divide-ink-50">
              {items.map((item) => (
                <NotificationRow
                  key={item._id}
                  item={item}
                  onClick={() => handleRowClick(item)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function NotificationRow({
  item,
  onClick,
}: {
  item: NotificationItem;
  onClick: () => void;
}) {
  const tone = toneFor(item.type);
  const unread = !item.read;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-ink-50",
          unread && "bg-primary-50/40"
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            tone.bg,
            tone.fg
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          {item.title && (
            <p
              className={cn(
                "truncate text-sm",
                unread ? "font-semibold text-ink-900" : "font-medium text-ink-800"
              )}
            >
              {item.title}
            </p>
          )}
          <p
            className={cn(
              "line-clamp-2 text-sm",
              unread
                ? item.title
                  ? "text-ink-700"
                  : "font-medium text-ink-900"
                : "text-ink-700"
            )}
          >
            {item.message}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">
            {timeAgo(item.createdAt)}
          </p>
        </div>
        {unread && (
          <span
            aria-hidden
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-orange"
          />
        )}
      </button>
    </li>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-brand-purple">
        <Bell className="h-5 w-5" />
      </span>
      <p className="text-sm text-ink-500">{message}</p>
    </div>
  );
}
