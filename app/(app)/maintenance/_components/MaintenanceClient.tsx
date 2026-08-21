"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SelectPill } from "@/components/ui/SelectPill";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
  CellCheckbox,
  CellAvatar,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Alert } from "@/components/ui/Alert";
import { StatCard } from "@/app/(app)/apiculteurs/_components/StatCard";
import { DatePicker, type DateFilterType } from "@/components/ui/DatePicker";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  CircleUser,
  Download,
  Search,
  TriangleAlert,
  Users,
  X,
} from "@/lib/icons";
import { formatFR, formatTimeFR } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import type { MaintenanceListItem } from "@/lib/maintenance/serializer";
import { MaintenanceDetailDrawer } from "./MaintenanceDetailDrawer";
import { UserProfilePreviewModal } from "@/components/ui/UserProfilePreviewModal";

type StatusFilter = "all" | "traite" | "non-traite";
type SortBy = "createdAt" | "startedAt" | "title";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 9;

const STATUS_OPTIONS = [
  { value: "all", label: "Tous", tone: "purple" as const },
  { value: "traite", label: "Traité", tone: "purple" as const },
  { value: "non-traite", label: "Non traité", tone: "orange" as const },
];

interface ListPayload {
  items: MaintenanceListItem[];
  total: number;
  totalAll: number;
  totalThisMonth: number;
  totalUnresolved: number;
  totalApiculteurs: number;
  page: number;
  pageSize: number;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function MaintenanceClient() {
  // ---- routing helpers ----------------------------------------------------
  // The dashboard's "Voir le détail" arrow navigates here with `?open=<id>`,
  // so we read that on mount, fetch the item if it's not already in the
  // current page, and open the drawer. We also clean up the query string so
  // refreshing the page doesn't re-open the drawer.
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
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [dateFilterType, setDateFilterType] =
    useState<DateFilterType>("est");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerItem, setDrawerItem] = useState<MaintenanceListItem | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Apiculteur profile preview opened from the avatar / "voir le profil" icon.
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [previewFallback, setPreviewFallback] = useState<{
    name?: string;
    role?: string;
    avatarSrc?: string;
  } | null>(null);

  const openPreview = useCallback((it: MaintenanceListItem) => {
    if (!it.apiculteurUserId) return;
    setPreviewFallback({
      name: it.apiculteur.name,
      role: "apiculteur",
      avatarSrc: it.apiculteur.avatarSrc,
    });
    setPreviewUserId(it.apiculteurUserId);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewUserId(null);
    setPreviewFallback(null);
  }, []);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice((curr) => (curr === message ? null : curr));
    }, 5000);
  }

  function openDrawer(item: MaintenanceListItem) {
    setDrawerItem(item);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    // Clear the deep-link guard so clicking the same notification again
    // (e.g. a new reply on a ticket the user just closed) re-opens the
    // drawer instead of being short-circuited as "already handled".
    handledOpenIdRef.current = null;
  }

  // Deep-link support: `/maintenance?open=<id>` opens the drawer for that
  // ticket. The handled id is remembered so subsequent re-renders (e.g. data
  // refetches after the drawer mutates the item) don't re-trigger the open.
  useEffect(() => {
    const openId = searchParams?.get("open");
    if (!openId || handledOpenIdRef.current === openId) return;

    // Try to find it in the currently loaded page first to avoid a round-trip.
    const local = data?.items.find((it) => it.id === openId);
    if (local) {
      handledOpenIdRef.current = openId;
      openDrawer(local);
      router.replace(pathname, { scroll: false });
      return;
    }

    // Not in the current page → fetch the single item.
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/maintenance/${openId}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const payload = (await res.json()) as { item?: MaintenanceListItem };
        if (payload.item) {
          handledOpenIdRef.current = openId;
          openDrawer(payload.item);
          router.replace(pathname, { scroll: false });
        }
      } catch {
        // Aborted or network error — silently ignore.
      }
    })();
    return () => ctrl.abort();
  }, [searchParams, data, router, pathname]);

  // Debounced search.
  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      250
    );
    return () => window.clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, dateFilterType, filterDate, rangeStart, rangeEnd]);

  const hasDateFilter = useMemo(() => {
    if (dateFilterType === "est-entre") return Boolean(rangeStart && rangeEnd);
    return Boolean(filterDate);
  }, [dateFilterType, filterDate, rangeStart, rangeEnd]);

  const dateTriggerLabel = useMemo(() => {
    if (!hasDateFilter) return "JJ/MM/AA";
    if (dateFilterType === "est-entre" && rangeStart && rangeEnd) {
      return `${formatFR(rangeStart)} → ${formatFR(rangeEnd)}`;
    }
    return filterDate ? formatFR(filterDate) : "JJ/MM/AA";
  }, [hasDateFilter, dateFilterType, rangeStart, rangeEnd, filterDate]);

  function handleDateFilterTypeChange(t: DateFilterType) {
    setDateFilterType(t);
    if (t !== "est-entre") {
      setRangeStart(null);
      setRangeEnd(null);
    }
  }

  function clearDateFilter() {
    setFilterDate(null);
    setRangeStart(null);
    setRangeEnd(null);
    setDateOpen(false);
  }

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      params.set("status", status);
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (dateFilterType !== "est-entre" && filterDate) {
        params.set("dateType", dateFilterType);
        params.set("date", filterDate.toISOString());
      } else if (dateFilterType === "est-entre" && rangeStart && rangeEnd) {
        params.set("dateType", "est-entre");
        params.set("dateFrom", rangeStart.toISOString());
        params.set("dateTo", rangeEnd.toISOString());
      }
      const res = await fetch(`/api/maintenance?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as ListPayload;
      setData(json);
    } catch {
      setError("Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    status,
    debouncedSearch,
    sortBy,
    sortDir,
    dateFilterType,
    filterDate,
    rangeStart,
    rangeEnd,
  ]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  function toggleAll(checked: boolean) {
    if (!checked || !data) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(data.items.map((it) => it.id)));
  }
  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function downloadCsv() {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    const url = `/api/maintenance/export${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    window.open(url, "_blank");
  }

  async function handleSave(
    item: MaintenanceListItem,
    nextStatus: MaintenanceListItem["status"]
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/maintenance/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return { ok: false, error: json.error };
      showNotice(
        nextStatus === "traite"
          ? `La demande "${item.title}" a été marquée comme traitée.`
          : `La demande "${item.title}" a été rouverte.`
      );
      void fetchList();
      return { ok: true };
    } catch {
      return { ok: false, error: "Erreur réseau." };
    }
  }

  async function handleReply(
    item: MaintenanceListItem,
    body: string
  ): Promise<{
    ok: boolean;
    error?: string;
    updated?: MaintenanceListItem;
  }> {
    try {
      const res = await fetch(`/api/maintenance/${item.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        item?: MaintenanceListItem;
      };
      if (!res.ok) return { ok: false, error: json.error };
      showNotice(`Réponse envoyée à "${item.title}".`);
      // Keep the drawer's local state authoritative + refresh the list
      // so the table sub-line ("X messages") updates.
      if (json.item) {
        setDrawerItem(json.item);
      }
      void fetchList();
      return { ok: true, updated: json.item };
    } catch {
      return { ok: false, error: "Erreur réseau." };
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const startRow = data ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endRow = data ? Math.min(page * PAGE_SIZE, data.total) : 0;

  return (
    <>
      {/* Bottom-right toast */}
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

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900 lg:text-h2">
          Gestion de maintenance
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Demandes de maintenance signalées par les apiculteurs.
        </p>
      </header>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        <StatCard
          label="Apiculteur"
          value={data?.totalApiculteurs ?? "…"}
          icon={<Users className="h-4 w-4" />}
          trend={
            data ? { value: 14, suffix: "ce mois" } : undefined
          }
        />
        <StatCard
          label="Demande"
          value={data?.totalThisMonth ?? "…"}
          icon={<AlertCircle className="h-4 w-4" />}
          tone="purple"
          trend={data ? { value: 0, suffix: "Ce mois" } : undefined}
        />
        <StatCard
          label="Demandes non traitées"
          value={data?.totalUnresolved ?? "…"}
          icon={<TriangleAlert className="h-4 w-4" />}
          tone="orange"
        />
      </div>

      {/* Filters bar — desktop */}
      <div className="mb-4 hidden flex-wrap items-center justify-between gap-3 lg:flex">
        <div className="flex flex-wrap items-center gap-3">
          <SelectPill
            variant="segmented"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
          />
          <MaintenanceDateFilter
            label={dateTriggerLabel}
            active={hasDateFilter}
            open={dateOpen}
            onOpenChange={setDateOpen}
            filterType={dateFilterType}
            onChangeFilterType={handleDateFilterTypeChange}
            date={filterDate}
            onChangeDate={setFilterDate}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onChangeRange={(s, e) => {
              setRangeStart(s);
              setRangeEnd(e);
            }}
            onClear={clearDateFilter}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-72 max-w-full items-center gap-2 rounded-full border border-ink-200 bg-white px-4">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, Email, Titre…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
            />
          </div>
          <Button
            leftIcon={<Download className="h-4 w-4" />}
            onClick={downloadCsv}
          >
            Télécharger
          </Button>
        </div>
      </div>

      {/* Filters bar — mobile */}
      <div className="mb-4 lg:hidden">
        {mobileSearchOpen ? (
          <div className="flex h-12 items-center gap-2 rounded-pill bg-white px-3 shadow-card">
            <Search className="h-4 w-4 shrink-0 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, Email, Titre…"
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
            <div className="flex shrink-0 items-center gap-2">
              <MaintenanceDateFilter
                compact
                label={dateTriggerLabel}
                active={hasDateFilter}
                open={dateOpen}
                onOpenChange={setDateOpen}
                filterType={dateFilterType}
                onChangeFilterType={handleDateFilterTypeChange}
                date={filterDate}
                onChangeDate={setFilterDate}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onChangeRange={(s, e) => {
                  setRangeStart(s);
                  setRangeEnd(e);
                }}
                onClear={clearDateFilter}
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
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {loading && <SkeletonState>Chargement…</SkeletonState>}
        {!loading && error && (
          <SkeletonState variant="error">{error}</SkeletonState>
        )}
        {!loading && !error && data?.items.length === 0 && (
          <SkeletonState>Aucune demande ne correspond aux filtres.</SkeletonState>
        )}
        {!loading &&
          !error &&
          data?.items.map((it) => (
            <MaintenanceCardMobile
              key={it.id}
              item={it}
              onOpen={() => openDrawer(it)}
              onAvatarClick={
                it.apiculteurUserId ? () => openPreview(it) : undefined
              }
            />
          ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <div className="rounded-2xl bg-white shadow-card">
          <Table>
            <TableHead>
              <Th className="w-10">
                <CellCheckbox
                  checked={
                    !!data?.items.length &&
                    selected.size === data.items.length
                  }
                  onChange={toggleAll}
                />
              </Th>
              <Th className="whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === "title") {
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    } else {
                      setSortBy("title");
                      setSortDir("asc");
                    }
                  }}
                  className="inline-flex items-center gap-1 text-left"
                >
                  NOM COMPLET ET E-MAIL
                  <SortIndicator active={sortBy === "title"} dir={sortDir} />
                </button>
              </Th>
              <Th className="whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === "createdAt") {
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    } else {
                      setSortBy("createdAt");
                      setSortDir("desc");
                    }
                  }}
                  className="inline-flex items-center gap-1 text-left"
                >
                  DATE
                  <SortIndicator active={sortBy === "createdAt"} dir={sortDir} />
                </button>
              </Th>
              <Th className="whitespace-nowrap">TITRES</Th>
              <Th className="whitespace-nowrap">STATUE</Th>
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
                      Aucune demande ne correspond aux filtres.
                    </div>
                  </Td>
                </TableRow>
              )}
              {!loading &&
                !error &&
                data?.items.map((it) => {
                  const isChecked = selected.has(it.id);
                  return (
                    <TableRow
                      key={it.id}
                      onDoubleClick={() => openDrawer(it)}
                      className="cursor-pointer"
                    >
                      <Td>
                        <CellCheckbox
                          checked={isChecked}
                          onChange={(c) => toggleOne(it.id, c)}
                        />
                      </Td>
                      <Td>
                        <CellAvatar
                          initials={initialsOf(it.apiculteur.name || "?")}
                          label={it.apiculteur.name || "Apiculteur supprimé"}
                          src={
                            it.apiculteur.avatarSrc &&
                            it.apiculteur.avatarSrc !==
                              "/brand/avatar-sample.svg"
                              ? it.apiculteur.avatarSrc
                              : undefined
                          }
                          onAvatarClick={
                            it.apiculteurUserId
                              ? () => openPreview(it)
                              : undefined
                          }
                          avatarTitle={
                            it.apiculteurUserId
                              ? `Voir le profil de ${it.apiculteur.name}`
                              : undefined
                          }
                        />
                        {it.apiculteur.email && (
                          <div className="ml-11 -mt-0.5 truncate text-xs text-ink-500">
                            {it.apiculteur.email}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <PostedDateCell item={it} />
                      </Td>
                      <Td>
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm text-ink-800">{it.title}</span>
                          <TicketMeta item={it} />
                        </div>
                      </Td>
                      <Td>
                        <StatusPill status={it.status} />
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1">
                          {it.apiculteurUserId && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPreview(it);
                              }}
                              aria-label={`Voir le profil de ${it.apiculteur.name}`}
                              title={`Voir le profil de ${it.apiculteur.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-primary-50 hover:text-brand-purple"
                            >
                              <CircleUser className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openDrawer(it)}
                            aria-label="Ouvrir le détail"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-primary-50 hover:text-brand-purple"
                          >
                            <ExpandIcon />
                          </button>
                        </div>
                      </Td>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 text-sm text-ink-500">
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
      </div>

      <MaintenanceDetailDrawer
        open={drawerOpen}
        item={drawerItem}
        onClose={closeDrawer}
        onSave={handleSave}
        onReply={handleReply}
      />

      {/* Apiculteur profile preview opened by the avatar / user icon. */}
      <UserProfilePreviewModal
        open={!!previewUserId}
        userId={previewUserId}
        fallback={previewFallback ?? undefined}
        onClose={closePreview}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Sub-components                              */
/* -------------------------------------------------------------------------- */

function SkeletonState({
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

/**
 * Tiny sub-line under the title: number of replies, when the thread has
 * any. (The date column carries the "posted X ago" info on its own.)
 */
function TicketMeta({ item }: { item: MaintenanceListItem }) {
  if (item.replyCount === 0) return null;
  return (
    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-ink-400">
      {item.replyCount} réponse{item.replyCount > 1 ? "s" : ""}
    </span>
  );
}

function StatusPill({ status }: { status: MaintenanceListItem["status"] }) {
  const isTreated = status === "traite";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isTreated
          ? "bg-primary-100 text-brand-purple"
          : "bg-accent-50 text-[#9B5A1F]"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isTreated ? "bg-brand-purple" : "bg-brand-orange"
        )}
      />
      {isTreated ? "Traité" : "Non traité"}
    </span>
  );
}

/**
 * Date cell for the maintenance table: shows the date the ticket was
 * posted (its `createdAt`), with a small "il y a X j" sub-line for quick
 * scanning. When a `non-traite` ticket is older than 5 days, the
 * sub-line turns orange.
 */
function PostedDateCell({ item }: { item: MaintenanceListItem }) {
  const posted = new Date(item.createdAt);
  const days = Math.floor(
    (Date.now() - posted.getTime()) / (24 * 60 * 60 * 1000)
  );
  const stale = item.status === "non-traite" && days >= 5;
  const ago =
    days === 0
      ? "aujourd'hui"
      : days === 1
      ? "hier"
      : `il y a ${days} j`;
  return (
    <div className="flex flex-col leading-tight">
      <span className="whitespace-nowrap text-sm text-ink-700">
        {formatFR(posted)}
        <span className="ml-1 text-ink-400">· {formatTimeFR(posted)}</span>
      </span>
      <span
        className={cn(
          "text-[11px]",
          stale ? "font-medium text-brand-orange" : "text-ink-400"
        )}
      >
        {ago}
      </span>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2H14V6" />
      <path d="M6 14H2V10" />
      <path d="M14 2L9 7" />
      <path d="M2 14L7 9" />
    </svg>
  );
}

function SortIndicator({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir;
}) {
  return (
    <span
      className={cn(
        "ml-1 inline-block transition-colors",
        active ? "text-brand-purple" : "text-ink-300"
      )}
    >
      {active && dir === "asc" ? "▲" : "▼"}
    </span>
  );
}

function MaintenanceCardMobile({
  item,
  onOpen,
  onAvatarClick,
}: {
  item: MaintenanceListItem;
  onOpen: () => void;
  onAvatarClick?: () => void;
}) {
  const postedAt = new Date(item.createdAt);
  const postedDate = formatFR(postedAt);
  const postedTime = formatTimeFR(postedAt);
  const days = Math.floor(
    (Date.now() - postedAt.getTime()) / (24 * 60 * 60 * 1000)
  );
  const stale = item.status === "non-traite" && days >= 5;
  const ago =
    days === 0
      ? "aujourd'hui"
      : days === 1
      ? "hier"
      : `il y a ${days} j`;
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex w-full cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-card transition-colors hover:bg-primary-50/50"
    >
      {onAvatarClick ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAvatarClick();
          }}
          aria-label={`Voir le profil de ${item.apiculteur.name}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple text-xs font-semibold text-white outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
        >
          {initialsOf(item.apiculteur.name || "?")}
        </button>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple text-xs font-semibold text-white">
          {initialsOf(item.apiculteur.name || "?")}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">
              {item.apiculteur.name || "Apiculteur supprimé"}
            </p>
            {item.apiculteur.email && (
              <p className="truncate text-xs text-ink-500">
                {item.apiculteur.email}
              </p>
            )}
          </div>
          <StatusPill status={item.status} />
        </div>
        <p className="mt-2 truncate text-sm text-ink-700">{item.title}</p>
        <p
          className={cn(
            "mt-1 text-xs",
            stale ? "font-medium text-brand-orange" : "text-ink-500"
          )}
        >
          Posté le {postedDate} à {postedTime} · {ago}
        </p>
        <div className="mt-1">
          <TicketMeta item={item} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Date filter popover                           */
/* -------------------------------------------------------------------------- */

interface DateFilterProps {
  label: string;
  active: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterType: DateFilterType;
  onChangeFilterType: (t: DateFilterType) => void;
  date: Date | null;
  onChangeDate: (d: Date | null) => void;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onChangeRange: (s: Date | null, e: Date | null) => void;
  onClear: () => void;
  compact?: boolean;
}

function MaintenanceDateFilter({
  label,
  active,
  open,
  onOpenChange,
  filterType,
  onChangeFilterType,
  date,
  onChangeDate,
  rangeStart,
  rangeEnd,
  onChangeRange,
  onClear,
  compact = false,
}: DateFilterProps) {
  const isRange = filterType === "est-entre";
  return (
    <div className="relative">
      {compact ? (
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-label="Filtrer par date"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            active
              ? "bg-primary-100 text-brand-purple"
              : "bg-primary-50 text-ink-600 hover:bg-primary-100 hover:text-brand-purple"
          )}
        >
          <Calendar className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          className={cn(
            "flex h-9 items-center gap-2 rounded-pill border border-ink-200 bg-white px-4 text-sm font-medium transition-colors hover:border-ink-300",
            active ? "text-ink-800" : "text-ink-400"
          )}
        >
          <span className="max-w-[160px] truncate">{label}</span>
          <Calendar className="h-4 w-4 shrink-0 text-ink-500" />
          <ChevronDown
            className={cn(
              "h-3 w-3 shrink-0 text-ink-500 transition-transform",
              open && "rotate-180"
            )}
            strokeWidth={2.5}
          />
        </button>
      )}
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            className={cn(
              "absolute top-full z-40 mt-2",
              compact ? "right-0" : "left-0",
              isRange && "max-w-[calc(100vw-2rem)]"
            )}
          >
            <DatePicker
              filterType={filterType}
              onChangeFilterType={onChangeFilterType}
              date={date}
              onChangeDate={onChangeDate}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onChangeRange={onChangeRange}
              onClear={onClear}
              alwaysOpen
              className="shadow-pop"
            />
          </div>
        </>
      )}
    </div>
  );
}
