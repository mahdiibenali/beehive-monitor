"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Mail, Phone, Trash2, X } from "@/lib/icons";
import { formatFR, formatTimeFR } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import type {
  ContactMessageListItem,
  ContactMessageStatus,
} from "@/lib/contact/serializer";

interface ContactMessageDrawerProps {
  open: boolean;
  item: ContactMessageListItem | null;
  /** Only super-admin sees the delete control. */
  canDelete: boolean;
  onClose: () => void;
  onStatusChange: (
    item: ContactMessageListItem,
    next: ContactMessageStatus
  ) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (
    item: ContactMessageListItem
  ) => Promise<{ ok: boolean; error?: string }>;
}

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Slide-in drawer showing the full message + the triage actions
 * (mark traité / re-open / supprimer). Email + phone style "Répondre"
 * buttons open the user's email client.
 */
export function ContactMessageDrawer({
  open,
  item,
  canDelete,
  onClose,
  onStatusChange,
  onDelete,
}: ContactMessageDrawerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (item) {
      setError(null);
      setConfirmingDelete(false);
    }
  }, [item?.id]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  async function changeStatus(next: ContactMessageStatus) {
    if (!item || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await onStatusChange(item, next);
      if (!res.ok) {
        setError(res.error ?? "Erreur lors de la sauvegarde.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!item || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await onDelete(item);
      if (!res.ok) {
        setError(res.error ?? "Suppression impossible.");
        setConfirmingDelete(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const createdAt = item?.createdAt ? new Date(item.createdAt) : null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={() => !busy && onClose()}
        className={cn(
          "absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={
          item ? `Message de ${item.fullName}` : "Détails du message"
        }
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {item && (
          <>
            <button
              type="button"
              onClick={() => !busy && onClose()}
              aria-label="Fermer"
              disabled={busy}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-600 transition-colors hover:bg-ink-50 hover:text-brand-purple disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Hero */}
            <header className="px-6 pb-5 pt-12">
              <div className="flex items-center gap-3">
                <Avatar initials={initialsOf(item.fullName)} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-ink-900">
                    {item.fullName || "Anonyme"}
                  </h2>
                  <a
                    href={`mailto:${item.email}`}
                    className="block truncate text-sm text-brand-purple hover:underline"
                  >
                    {item.email}
                  </a>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusPill status={item.status} />
                {createdAt && (
                  <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs text-ink-600">
                    Reçu le {formatFR(createdAt)} à {formatTimeFR(createdAt)}
                  </span>
                )}
                {item.status === "handled" && item.handledBy?.name && (
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs text-brand-purple">
                    Traité par {item.handledBy.name}
                  </span>
                )}
              </div>
            </header>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto border-t border-ink-100 px-6 py-5">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Message
                </h3>
                <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-ink-50/70 p-4 text-sm leading-relaxed text-ink-800">
                  {item.message}
                </p>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <a
                  href={`mailto:${item.email}?subject=${encodeURIComponent(
                    `Re: votre message Nahoul`
                  )}`}
                  className="flex items-center gap-2 rounded-2xl border border-ink-100 px-4 py-3 text-sm text-ink-700 transition-colors hover:border-brand-purple hover:text-brand-purple"
                >
                  <Mail className="h-4 w-4 text-brand-purple" />
                  <span className="truncate">Répondre par e-mail</span>
                </a>
                {/* Placeholder for a future phone number on the form. */}
                <button
                  type="button"
                  disabled
                  title="Aucun numéro fourni"
                  className="flex items-center gap-2 rounded-2xl border border-ink-100 px-4 py-3 text-sm text-ink-400"
                >
                  <Phone className="h-4 w-4" />
                  <span className="truncate">Téléphone non fourni</span>
                </button>
              </section>

              {error && (
                <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}
            </div>

            {/* Footer actions */}
            <footer className="border-t border-ink-100 bg-ink-50/40 px-6 py-4">
              {confirmingDelete ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-700">
                    Supprimer définitivement ce message&nbsp;?
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmingDelete(false)}
                      disabled={busy}
                    >
                      Annuler
                    </Button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={busy}
                      className="inline-flex h-9 items-center gap-2 rounded-pill bg-danger px-5 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(true)}
                        disabled={busy}
                        className="flex h-10 w-10 items-center justify-center rounded-pill text-ink-400 transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                        aria-label="Supprimer le message"
                        title="Supprimer le message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.status === "handled" ? (
                      <Button
                        variant="ghost"
                        onClick={() => void changeStatus("read")}
                        disabled={busy}
                      >
                        Rouvrir
                      </Button>
                    ) : (
                      <>
                        {item.status !== "new" && (
                          <Button
                            variant="ghost"
                            onClick={() => void changeStatus("new")}
                            disabled={busy}
                          >
                            Marquer non-lu
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => void changeStatus("handled")}
                          disabled={busy}
                        >
                          Marquer comme traité
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

function StatusPill({ status }: { status: ContactMessageStatus }) {
  const config: Record<
    ContactMessageStatus,
    { label: string; pill: string; dot: string }
  > = {
    new: {
      label: "Non lu",
      pill: "bg-accent-50 text-[#9B5A1F]",
      dot: "bg-brand-orange",
    },
    read: {
      label: "Lu",
      pill: "bg-primary-50 text-brand-purple",
      dot: "bg-brand-purple",
    },
    handled: {
      label: "Traité",
      pill: "bg-primary-100 text-brand-purple",
      dot: "bg-brand-purple",
    },
  };
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        c.pill
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
