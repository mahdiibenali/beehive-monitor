"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SelectPill } from "@/components/ui/SelectPill";
import { Pagination } from "@/components/ui/Pagination";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from "@/components/ui/Table";
import { Mail, Search, X } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { formatFR, formatTimeFR } from "@/lib/calendar";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type {
  ContactMessageListItem,
  ContactMessageStatus,
} from "@/lib/contact/serializer";
import { ContactMessageDrawer } from "./ContactMessageDrawer";

type StatusFilter = "all" | ContactMessageStatus;

const PAGE_SIZE = 12;

const STATUS_OPTIONS = [
  { value: "all", label: "Tous", tone: "purple" as const },
  { value: "new", label: "Nouveaux", tone: "orange" as const },
  { value: "read", label: "Lus", tone: "purple" as const },
  { value: "handled", label: "Traités", tone: "purple" as const },
];

interface ListPayload {
  items: ContactMessageListItem[];
  total: number;
  totalAll: number;
  counts: { new: number; read: number; handled: number };
  page: number;
  pageSize: number;
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

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );
  if (seconds < 45) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return `${formatFR(date)}`;
}

export function ContactMessagesClient() {
  const { user } = useCurrentUser();
  const canDelete = user.role === "super-admin";

  // Routing — same deep-link pattern as `/maintenance` so that clicking a
  // contact-message notification opens the drawer for that message.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledOpenIdRef = useRef<string | null>(null);

  const [data, setData] = useState<ListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [drawerItem, setDrawerItem] =
    useState<ContactMessageListItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(
      () => setNotice((curr) => (curr === message ? null : curr)),
      4500
    );
  }

  const openDrawer = useCallback((item: ContactMessageListItem) => {
    setDrawerItem(item);
    setDrawerOpen(true);
  }, []);

  function closeDrawer() {
    setDrawerOpen(false);
    handledOpenIdRef.current = null;
  }

  // Debounce search.
  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      250
    );
    return () => window.clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(
        `/api/contact-messages?${params.toString()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as ListPayload;
      setData(json);
    } catch {
      setError("Impossible de charger les messages.");
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  // Deep-link `/messages-contact?open=<id>` — opens the drawer for the
  // notification target. Loaded item wins; otherwise we fetch it.
  useEffect(() => {
    const openId = searchParams?.get("open");
    if (!openId || handledOpenIdRef.current === openId) return;

    const local = data?.items.find((it) => it.id === openId);
    if (local) {
      handledOpenIdRef.current = openId;
      openDrawer(local);
      router.replace(pathname, { scroll: false });
      return;
    }

    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/contact-messages/${openId}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const payload = (await res.json()) as {
          item?: ContactMessageListItem;
        };
        if (payload.item) {
          handledOpenIdRef.current = openId;
          openDrawer(payload.item);
          router.replace(pathname, { scroll: false });
          // The GET above already promoted "new" → "read"; refresh the
          // list so the counter and badge are current.
          void fetchList();
        }
      } catch {
        /* aborted / network — ignore */
      }
    })();
    return () => ctrl.abort();
  }, [searchParams, data, router, pathname, openDrawer, fetchList]);

  async function openItem(item: ContactMessageListItem) {
    openDrawer(item);
    // If this is the first time it's being viewed, promote new → read.
    if (item.status === "new") {
      try {
        const res = await fetch(`/api/contact-messages/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "read" }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            item?: ContactMessageListItem;
          };
          if (json.item) {
            setDrawerItem(json.item);
          }
          void fetchList();
        }
      } catch {
        /* swallow — UX still works without this */
      }
    }
  }

  async function handleStatusChange(
    item: ContactMessageListItem,
    nextStatus: ContactMessageStatus
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/contact-messages/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        item?: ContactMessageListItem;
      };
      if (!res.ok) return { ok: false, error: json.error };
      if (json.item) setDrawerItem(json.item);
      showNotice(
        nextStatus === "handled"
          ? "Message marqué comme traité."
          : nextStatus === "new"
            ? "Message remis en non-lu."
            : "Message rouvert."
      );
      void fetchList();
      return { ok: true };
    } catch {
      return { ok: false, error: "Erreur réseau." };
    }
  }

  async function handleDelete(
    item: ContactMessageListItem
  ): Promise<{ ok: boolean; error?: string }> {
    if (!canDelete) return { ok: false, error: "Action non autorisée." };
    try {
      const res = await fetch(`/api/contact-messages/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        return { ok: false, error: json.error ?? "Erreur serveur." };
      }
      setDrawerOpen(false);
      setDrawerItem(null);
      handledOpenIdRef.current = null;
      showNotice("Message supprimé.");
      void fetchList();
      return { ok: true };
    } catch {
      return { ok: false, error: "Erreur réseau." };
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const startRow = data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endRow = data ? Math.min(page * PAGE_SIZE, data.total) : 0;

  const headerSubtitle = useMemo(() => {
    if (!data) return "Boîte de réception du formulaire public.";
    const n = data.counts.new;
    if (n === 0) return "Tous les messages sont à jour.";
    return `${n} message${n > 1 ? "s" : ""} non lu${n > 1 ? "s" : ""}.`;
  }, [data]);

  return (
    <>
      {notice && (
        <div className="fixed bottom-6 right-6 z-[70] animate-fade-in-up">
          <Alert
            variant="success"
            title={notice}
            compact
            onClose={() => setNotice(null)}
          />
        </div>
      )}

      <PageHeader title="Messages de contact" subtitle={headerSubtitle} />

      {/* Filters — desktop */}
      <div className="mb-4 hidden flex-wrap items-center justify-between gap-3 lg:flex">
        <SelectPill
          variant="segmented"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
        />
        <div className="flex h-9 w-72 max-w-full items-center gap-2 rounded-full border border-ink-200 bg-white px-4">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, e-mail, contenu…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
          />
        </div>
      </div>

      {/* Filters — mobile */}
      <div className="mb-4 lg:hidden">
        {mobileSearchOpen ? (
          <div className="flex h-12 items-center gap-2 rounded-pill bg-white px-3 shadow-card">
            <Search className="h-4 w-4 shrink-0 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, e-mail, contenu…"
              autoFocus
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
            />
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setMobileSearchOpen(false);
              }}
              aria-label="Fermer la recherche"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-primary-50 hover:text-brand-purple"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-pill bg-white p-2 shadow-card">
            <SelectPill
              variant="segmented"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => setStatus(v as StatusFilter)}
            />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Rechercher"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-ink-600 transition-colors hover:bg-primary-100 hover:text-brand-purple",
                search && "bg-primary-100 text-brand-purple"
              )}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {loading && <Hint>Chargement…</Hint>}
        {!loading && error && <Hint variant="error">{error}</Hint>}
        {!loading && !error && data?.items.length === 0 && (
          <Hint>Aucun message ne correspond aux filtres.</Hint>
        )}
        {!loading &&
          !error &&
          data?.items.map((it) => (
            <MobileCard key={it.id} item={it} onOpen={() => void openItem(it)} />
          ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHead>
            <Th className="whitespace-nowrap">EXPÉDITEUR</Th>
            <Th className="whitespace-nowrap">E-MAIL</Th>
            <Th>MESSAGE</Th>
            <Th className="whitespace-nowrap">REÇU</Th>
            <Th className="whitespace-nowrap">STATUT</Th>
            <Th className="w-10" />
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <Td colSpan={6}>
                  <div className="py-10 text-center text-sm text-ink-500">
                    Chargement…
                  </div>
                </Td>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <Td colSpan={6}>
                  <div className="py-10 text-center text-sm text-brand-orange">
                    {error}
                  </div>
                </Td>
              </TableRow>
            )}
            {!loading && !error && data?.items.length === 0 && (
              <TableRow>
                <Td colSpan={6}>
                  <div className="py-10 text-center text-sm text-ink-500">
                    Aucun message ne correspond aux filtres.
                  </div>
                </Td>
              </TableRow>
            )}
            {!loading &&
              !error &&
              data?.items.map((it) => {
                const isUnread = it.status === "new";
                return (
                  <TableRow
                    key={it.id}
                    onClick={() => void openItem(it)}
                    onDoubleClick={() => void openItem(it)}
                    className="cursor-pointer"
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={initialsOf(it.fullName)}
                          size="sm"
                        />
                        <span
                          className={cn(
                            "text-sm",
                            isUnread
                              ? "font-semibold text-ink-900"
                              : "text-ink-800"
                          )}
                        >
                          {it.fullName || "Anonyme"}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-sm text-ink-700">{it.email}</span>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "block max-w-md truncate text-sm",
                          isUnread ? "text-ink-800" : "text-ink-600"
                        )}
                        title={it.message}
                      >
                        {it.message}
                      </span>
                    </Td>
                    <Td>
                      <span className="whitespace-nowrap text-sm text-ink-700">
                        {formatFR(new Date(it.createdAt))}
                        <span className="ml-1 text-ink-400">
                          · {formatTimeFR(new Date(it.createdAt))}
                        </span>
                      </span>
                      <div className="text-[11px] text-ink-400">
                        {timeAgo(it.createdAt)}
                      </div>
                    </Td>
                    <Td>
                      <StatusPill status={it.status} />
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end">
                        <Mail className="h-4 w-4 text-ink-300" />
                      </div>
                    </Td>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-500">
          <span>
            {data && data.total > 0
              ? `${startRow}-${endRow} sur ${data.total}`
              : "—"}
          </span>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <ContactMessageDrawer
        open={drawerOpen}
        item={drawerItem}
        canDelete={canDelete}
        onClose={closeDrawer}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Sub-components                              */
/* -------------------------------------------------------------------------- */

function Hint({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "error";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 text-center text-sm shadow-card",
        variant === "error" ? "text-brand-orange" : "text-ink-500"
      )}
    >
      {children}
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

function MobileCard({
  item,
  onOpen,
}: {
  item: ContactMessageListItem;
  onOpen: () => void;
}) {
  const isUnread = item.status === "new";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-card transition-colors hover:bg-primary-50/50"
    >
      <Avatar initials={initialsOf(item.fullName)} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              isUnread ? "font-semibold text-ink-900" : "text-ink-800"
            )}
          >
            {item.fullName || "Anonyme"}
          </p>
          <StatusPill status={item.status} />
        </div>
        <p className="truncate text-xs text-ink-500">{item.email}</p>
        <p
          className={cn(
            "mt-2 line-clamp-2 text-sm",
            isUnread ? "text-ink-800" : "text-ink-600"
          )}
        >
          {item.message}
        </p>
        <p className="mt-1 text-[11px] text-ink-400">
          Reçu {timeAgo(item.createdAt)}
        </p>
      </div>
    </button>
  );
}
