"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ChevronDown, Download, X } from "@/lib/icons";
import { formatFR, formatTimeFR } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import type {
  MaintenanceListItem,
  MaintenanceReply,
} from "@/lib/maintenance/serializer";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { UserProfilePreviewModal } from "@/components/ui/UserProfilePreviewModal";

interface MaintenanceDetailDrawerProps {
  open: boolean;
  item: MaintenanceListItem | null;
  onClose: () => void;
  /**
   * Called when the user toggles the "Traiter" switch and clicks Confirm.
   * Parent persists the change via PATCH and refreshes the list.
   */
  onSave: (
    item: MaintenanceListItem,
    nextStatus: MaintenanceListItem["status"]
  ) => Promise<{ ok: boolean; error?: string }>;
  /**
   * Called when the user submits a new reply. Parent posts to the API
   * and is expected to return the updated ticket (so the new reply
   * appears immediately).
   */
  onReply: (
    item: MaintenanceListItem,
    body: string
  ) => Promise<{ ok: boolean; error?: string; updated?: MaintenanceListItem }>;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

/** Localised "il y a …" for the posted-ago badge and reply timestamps. */
function timeAgo(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 45) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j à ${formatTimeFR(date)}`;
  return `${formatFR(date)} à ${formatTimeFR(date)}`;
}

/** Threshold (days) over which a pending ticket is shown in orange. */
const STALE_DAYS = 5;

export function MaintenanceDetailDrawer({
  open,
  item,
  onClose,
  onSave,
  onReply,
}: MaintenanceDetailDrawerProps) {
  const { user } = useCurrentUser();
  const [treated, setTreated] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local replies copy so the thread updates instantly without waiting
  // for the parent to round-trip a full refresh.
  const [localReplies, setLocalReplies] = useState<MaintenanceReply[]>([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Sender profile preview — opened by clicking on a reply's avatar.
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [previewFallback, setPreviewFallback] = useState<{
    name?: string;
    role?: string;
    avatarSrc?: string;
  } | null>(null);

  // Reset the form whenever a new demand is opened.
  useEffect(() => {
    if (item) {
      setTreated(item.status === "traite");
      setInfoOpen(true);
      setError(null);
      setLocalReplies(item.replies ?? []);
      setReplyDraft("");
      setReplyError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // Scroll the thread to the bottom when the drawer opens / new reply.
  //
  // The drawer slides in with a CSS transition, so calling
  // `scrollIntoView` synchronously inside the effect lands before layout
  // has settled and the user ends up at the top of the drawer. We defer
  // with two RAFs (first paint → ensure layout → scroll) plus a small
  // safety timeout for the transition to finish on slower machines.
  useEffect(() => {
    if (!open) return;
    let raf1 = 0;
    let raf2 = 0;
    let timeout = 0;
    const scroll = () => {
      const el = threadEndRef.current;
      if (!el) return;
      el.scrollIntoView({ block: "end", behavior: "auto" });
    };
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(scroll);
    });
    // Belt-and-braces: re-scroll once the drawer transition (~250ms) ends,
    // in case the first attempt happened before the panel finished sliding.
    timeout = window.setTimeout(scroll, 300);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(timeout);
    };
  }, [open, localReplies.length, item?.id]);

  // Escape closes the drawer (only when no in-flight request).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving && !sending) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, sending, onClose]);

  function handleCancel() {
    if (saving || sending) return;
    onClose();
  }

  async function handleConfirm() {
    if (!item || saving) return;
    const nextStatus: MaintenanceListItem["status"] = treated
      ? "traite"
      : "non-traite";
    if (nextStatus === item.status) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await onSave(item, nextStatus);
      if (!res.ok) {
        setError(res.error ?? "Erreur lors de la sauvegarde.");
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitReply(e: FormEvent) {
    e.preventDefault();
    if (!item || sending) return;
    const body = replyDraft.trim();
    if (!body) return;
    setSending(true);
    setReplyError(null);
    try {
      const res = await onReply(item, body);
      if (!res.ok) {
        setReplyError(res.error ?? "Impossible d'envoyer la réponse.");
        return;
      }
      if (res.updated) {
        setLocalReplies(res.updated.replies);
      }
      setReplyDraft("");
    } finally {
      setSending(false);
    }
  }

  const startedAt = item?.startedAt ? new Date(item.startedAt) : null;
  const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
  const inscriptionAt = item?.apiculteur.inscriptionAt
    ? new Date(item.apiculteur.inscriptionAt)
    : null;

  // "Posté il y a X jours" — orange-tinted if a pending ticket has been
  // sitting for more than STALE_DAYS, otherwise a neutral pill.
  const ageBadge = useMemo(() => {
    if (!createdAt) return null;
    const days = Math.floor(
      (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    const stale = item?.status === "non-traite" && days >= STALE_DAYS;
    return {
      label:
        days === 0
          ? "Posté aujourd'hui"
          : days === 1
          ? "Posté hier"
          : `Posté il y a ${days} jours`,
      tone: stale ? ("orange" as const) : ("purple" as const),
    };
  }, [createdAt, item?.status]);

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
        onClick={handleCancel}
        className={cn(
          "absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Sliding panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={
          item ? `Demande de ${item.apiculteur.name}` : "Détails maintenance"
        }
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {item && (
          <>
            {/* Close button */}
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Fermer"
              disabled={saving || sending}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-600 transition-colors hover:bg-ink-50 hover:text-brand-purple disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Hero header */}
            <header className="px-6 pb-4 pt-12">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    initials={initialsOf(item.apiculteur.name)}
                    src={
                      item.apiculteur.avatarSrc &&
                      item.apiculteur.avatarSrc !== "/brand/avatar-sample.svg"
                        ? item.apiculteur.avatarSrc
                        : undefined
                    }
                    size="md"
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-ink-900">
                      {item.apiculteur.name || "Apiculteur supprimé"}
                    </h2>
                    {item.apiculteur.email && (
                      <p className="truncate text-xs text-ink-500">
                        {item.apiculteur.email}
                      </p>
                    )}
                  </div>
                </div>
                {item.attachmentUrl ? (
                  <a
                    href={item.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 text-xs font-medium text-ink-700 transition-colors hover:border-brand-purple hover:text-brand-purple"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Téléchargé
                  </a>
                ) : (
                  <span
                    aria-disabled
                    className="inline-flex h-9 shrink-0 cursor-not-allowed items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 text-xs font-medium text-ink-300"
                    title="Aucune pièce jointe"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Téléchargé
                  </span>
                )}
              </div>

              {/* Posted-ago badge — turns orange when a pending ticket is stale. */}
              {ageBadge && createdAt && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
                      ageBadge.tone === "orange"
                        ? "bg-accent-50 text-[#9B5A1F]"
                        : "bg-primary-50 text-brand-purple"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        ageBadge.tone === "orange"
                          ? "bg-brand-orange"
                          : "bg-brand-purple"
                      )}
                    />
                    {ageBadge.label}
                  </span>
                  <span className="text-ink-400">·</span>
                  <span>
                    {formatFR(createdAt)} à {formatTimeFR(createdAt)}
                  </span>
                </div>
              )}
            </header>

            {/* Stats row */}
            <section className="px-6">
              <div className="grid grid-cols-3 divide-x divide-ink-100 rounded-2xl border border-ink-100 bg-white">
                <StatCell label="RUCHES" value={fmt2(item.apiculteur.rucheCount)} />
                <StatCell label="FERMES" value={fmt2(item.apiculteur.fermeCount)} />
                <StatCell
                  label="INSCRIPTION"
                  value={inscriptionAt ? formatFR(inscriptionAt) : "—"}
                />
              </div>
            </section>

            {/* Information section */}
            <section className="px-6 pt-4">
              <button
                type="button"
                onClick={() => setInfoOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-2xl bg-ink-50 px-4 py-3 text-left text-sm font-semibold text-ink-800 transition-colors hover:bg-primary-50"
                aria-expanded={infoOpen}
              >
                Information
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-ink-500 transition-transform",
                    infoOpen && "rotate-180"
                  )}
                />
              </button>
            </section>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-4 pt-4">
              {infoOpen && (
                <article className="space-y-3 text-sm leading-relaxed text-ink-700">
                  <h3 className="text-base font-semibold text-ink-900">
                    {item.title}
                  </h3>
                  {item.description ? (
                    item.description.split(/\n+/).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))
                  ) : (
                    <p className="text-ink-400">Aucune description fournie.</p>
                  )}

                  {/* Footer metadata */}
                  <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-xs text-ink-500">
                    {startedAt && (
                      <div>
                        <p className="font-semibold uppercase tracking-wide text-ink-400">
                          Demande reçue
                        </p>
                        <p className="mt-0.5 text-ink-800">
                          {formatFR(startedAt)} à {formatTimeFR(startedAt)}
                        </p>
                      </div>
                    )}
                    {item.dueAt && (
                      <div>
                        <p className="font-semibold uppercase tracking-wide text-ink-400">
                          Échéance
                        </p>
                        <p className="mt-0.5 text-ink-800">
                          {formatFR(new Date(item.dueAt))}
                        </p>
                      </div>
                    )}
                    {item.treatedAt && (
                      <div>
                        <p className="font-semibold uppercase tracking-wide text-ink-400">
                          Traitée le
                        </p>
                        <p className="mt-0.5 text-ink-800">
                          {formatFR(new Date(item.treatedAt))} à{" "}
                          {formatTimeFR(new Date(item.treatedAt))}
                        </p>
                      </div>
                    )}
                    {item.treatedBy?.name && (
                      <div>
                        <p className="font-semibold uppercase tracking-wide text-ink-400">
                          Traitée par
                        </p>
                        <p className="mt-0.5 text-ink-800">{item.treatedBy.name}</p>
                      </div>
                    )}
                  </div>
                </article>
              )}

              {/* Conversation thread */}
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-ink-900">
                    Conversation
                  </h4>
                  <span className="text-xs text-ink-400">
                    {localReplies.length === 0
                      ? "Aucune réponse"
                      : `${localReplies.length} message${
                          localReplies.length > 1 ? "s" : ""
                        }`}
                  </span>
                </div>

                {localReplies.length === 0 ? (
                  <p className="rounded-2xl bg-ink-50 px-4 py-6 text-center text-xs text-ink-500">
                    Aucun message pour le moment. Envoyez la première réponse
                    ci-dessous.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {localReplies.map((r) => {
                      const isSelf = r.authorId && r.authorId === user.id;
                      const canOpen = !!r.authorId;
                      return (
                        <li
                          key={r.id || r.createdAt}
                          className={cn(
                            "flex gap-3",
                            isSelf && "flex-row-reverse"
                          )}
                        >
                          <button
                            type="button"
                            disabled={!canOpen}
                            onClick={() => {
                              if (!r.authorId) return;
                              setPreviewFallback({
                                name: r.authorName,
                                role: r.authorRole,
                                avatarSrc: r.authorAvatarSrc,
                              });
                              setPreviewUserId(r.authorId);
                            }}
                            aria-label={
                              canOpen
                                ? `Voir le profil de ${r.authorName}`
                                : undefined
                            }
                            className={cn(
                              "shrink-0 rounded-full outline-none transition-transform",
                              canOpen
                                ? "cursor-pointer hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
                                : "cursor-default"
                            )}
                          >
                            <Avatar
                              initials={initialsOf(r.authorName)}
                              src={
                                r.authorAvatarSrc &&
                                r.authorAvatarSrc !== "/brand/avatar-sample.svg"
                                  ? r.authorAvatarSrc
                                  : undefined
                              }
                              size="sm"
                            />
                          </button>
                          <div
                            className={cn(
                              "max-w-[78%] rounded-2xl px-3 py-2 text-sm",
                              isSelf
                                ? "bg-brand-purple text-white"
                                : "bg-ink-50 text-ink-800"
                            )}
                          >
                            <p
                              className={cn(
                                "mb-1 text-[11px] font-semibold uppercase tracking-wide",
                                isSelf ? "text-white/80" : "text-ink-500"
                              )}
                            >
                              {r.authorName}
                              {r.authorRole && (
                                <span
                                  className={cn(
                                    "ml-1 font-normal normal-case tracking-normal",
                                    isSelf ? "text-white/70" : "text-ink-400"
                                  )}
                                >
                                  · {labelForRole(r.authorRole)}
                                </span>
                              )}
                            </p>
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {r.body}
                            </p>
                            <p
                              className={cn(
                                "mt-1 text-[10px]",
                                isSelf ? "text-white/70" : "text-ink-400"
                              )}
                            >
                              {timeAgo(r.createdAt)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div ref={threadEndRef} />
              </section>
            </div>

            {/* Reply composer + footer */}
            <footer className="space-y-3 border-t border-ink-100 px-6 py-4">
              <form onSubmit={handleSubmitReply} className="space-y-2">
                <label
                  htmlFor="reply-body"
                  className="block text-xs font-semibold uppercase tracking-wide text-ink-500"
                >
                  Répondre
                </label>
                <textarea
                  id="reply-body"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Écrivez votre réponse…"
                  rows={2}
                  disabled={sending}
                  className="w-full resize-none rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-purple disabled:opacity-50"
                />
                {replyError && (
                  <p className="text-xs font-medium text-brand-orange">
                    {replyError}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={sending || replyDraft.trim().length === 0}
                  >
                    {sending ? "Envoi…" : "Envoyer"}
                  </Button>
                </div>
              </form>

              {error && (
                <p className="text-xs font-medium text-brand-orange">{error}</p>
              )}
              <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
                <Switch
                  checked={treated}
                  onChange={setTreated}
                  disabled={saving}
                  label="Traiter"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleConfirm}
                    disabled={saving}
                  >
                    {saving ? "…" : "Confirmer"}
                  </Button>
                </div>
              </div>
            </footer>
          </>
        )}
      </aside>

      {/* Sender profile preview — opens above the drawer when a reply's
          avatar is clicked. */}
      <UserProfilePreviewModal
        open={!!previewUserId}
        userId={previewUserId}
        fallback={previewFallback ?? undefined}
        onClose={() => {
          setPreviewUserId(null);
          setPreviewFallback(null);
        }}
      />
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function fmt2(n: number) {
  return n.toString().padStart(2, "0");
}

function labelForRole(role: string): string {
  switch (role) {
    case "super-admin":
      return "Super admin";
    case "admin":
      return "Admin";
    case "apiculteur":
      return "Apiculteur";
    default:
      return role;
  }
}
