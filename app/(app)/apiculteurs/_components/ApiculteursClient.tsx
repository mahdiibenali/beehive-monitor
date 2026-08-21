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
  TableFooter,
  CellCheckbox,
  CellAvatar,
  CellStatus,
  CellNumber,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Confirmation } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DatePicker, type DateFilterType } from "@/components/ui/DatePicker";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
  Edit,
  Layers,
  Phone,
  Plus,
  Search,
  Trash2,
  User as UserIcon,
  Users,
  Wheat,
  X,
} from "@/lib/icons";
import { formatFR } from "@/lib/calendar";
import type { ApiculteurListItem } from "@/lib/apiculteurs/serializer";
import { cn } from "@/lib/cn";
import { StatCard } from "./StatCard";
import { OverviewMap, OverviewMapLegend } from "./OverviewMap";
import type { OverviewPoint } from "./OverviewMapInner";
import { ApiculteurDetailPanel } from "./ApiculteurDetailPanel";
import { ApiculteurDetailDrawer } from "./ApiculteurDetailDrawer";
import {
  ApiculteurFormModal,
  type ApiculteurFormValues,
} from "./ApiculteurFormModal";

type StatusFilter = "all" | "active" | "expired" | "suspended";
type SortBy = "name" | "createdAt" | "subscriptionEndsAt" | "rucheCount";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 9;

const STATUS_OPTIONS = [
  { value: "all", label: "Tous", tone: "purple" as const },
  { value: "active", label: "Active", tone: "purple" as const },
  { value: "expired", label: "Expiré", tone: "orange" as const },
  { value: "suspended", label: "Susp", tone: "red" as const },
];

interface ListPayload {
  items: ApiculteurListItem[];
  total: number;
  totalAll: number;
  totalActive: number;
  totalExpired: number;
  totalSuspended: number;
  totalRuches: number;
  totalFermes: number;
  monthly: {
    apiculteurs: number;
    activeSubscriptions: number;
  };
  mapPoints: OverviewPoint[];
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

function fmtCount(n: number | undefined) {
  return n === undefined ? "…" : String(n).padStart(2, "0");
}

export function ApiculteursClient() {
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
  const [selectedDetail, setSelectedDetail] =
    useState<ApiculteurListItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openDrawer(item: ApiculteurListItem) {
    setSelectedDetail(item);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    // Reset the deep-link guard so a future notification click for the
    // same apiculteur re-opens the drawer.
    handledOpenIdRef.current = null;
  }

  // ---- deep-link support ------------------------------------------------
  // `/apiculteurs?open=<id>` (e.g. coming from a notification or the
  // dashboard) opens the detail drawer for the given id. We try the
  // currently loaded page first, fall back to a single-item fetch when
  // the apiculteur isn't on this page, and finally clean up the URL so
  // refreshing doesn't reopen the drawer.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledOpenIdRef = useRef<string | null>(null);

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
        const res = await fetch(`/api/apiculteurs/${openId}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const payload = (await res.json()) as { item?: ApiculteurListItem };
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

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ApiculteurListItem | null>(null);
  const [confirmDelete, setConfirmDelete] =
    useState<ApiculteurListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice((current) => (current === message ? null : current));
    }, 5000);
  }

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      250
    );
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [
    status,
    debouncedSearch,
    dateFilterType,
    filterDate,
    rangeStart,
    rangeEnd,
    sortBy,
    sortDir,
  ]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        status,
        sortBy,
        sortDir,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (dateFilterType === "est-entre" && rangeStart && rangeEnd) {
        params.set("dateType", "est-entre");
        params.set("dateFrom", rangeStart.toISOString());
        params.set("dateTo", rangeEnd.toISOString());
      } else if (filterDate && dateFilterType !== "est-entre") {
        params.set("dateType", dateFilterType);
        params.set("date", filterDate.toISOString());
      }
      const res = await fetch(`/api/apiculteurs?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ListPayload & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erreur de chargement.");
        return;
      }
      setData(json);
      setSelected((prev) => {
        const next = new Set<string>();
        for (const it of json.items) if (prev.has(it.id)) next.add(it.id);
        return next;
      });
      // Keep the detail panel in sync if the selected row was updated/removed.
      setSelectedDetail((current) => {
        if (!current) return null;
        const updated = json.items.find((i) => i.id === current.id);
        return updated ?? current;
      });
    } catch {
      setError("Erreur réseau.");
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

  function clearDateFilter() {
    setFilterDate(null);
    setRangeStart(null);
    setRangeEnd(null);
  }

  function handleDateFilterTypeChange(next: DateFilterType) {
    setDateFilterType(next);
    if (next === "est-entre") setFilterDate(null);
    else {
      setRangeStart(null);
      setRangeEnd(null);
    }
  }

  const dateTriggerLabel = useMemo(() => {
    if (dateFilterType === "est-entre") {
      if (rangeStart && rangeEnd)
        return `${formatFR(rangeStart)} – ${formatFR(rangeEnd)}`;
      if (rangeStart) return formatFR(rangeStart);
      return "JJ/MM/AA";
    }
    return filterDate ? formatFR(filterDate) : "JJ/MM/AA";
  }, [dateFilterType, filterDate, rangeStart, rangeEnd]);

  const hasDateFilter =
    dateFilterType === "est-entre"
      ? !!(rangeStart && rangeEnd)
      : !!filterDate;

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function toggleSort(col: SortBy) {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / (data.pageSize || PAGE_SIZE)))
    : 1;
  const startIdx = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const endIdx = data ? startIdx + data.items.length - 1 : 0;
  const allOnPageSelected =
    !!data &&
    data.items.length > 0 &&
    data.items.every((i) => selected.has(i.id));

  function toggleAllOnPage(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (!data) return next;
      for (const it of data.items) {
        if (checked) next.add(it.id);
        else next.delete(it.id);
      }
      return next;
    });
  }
  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleCreate(values: ApiculteurFormValues) {
    const res = await fetch("/api/apiculteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: json.error };
    await fetchList();
    showNotice(`L'apiculteur "${values.name}" a été créé avec succès !`);
    return { ok: true };
  }

  async function handleUpdate(values: ApiculteurFormValues) {
    if (!editing) return { ok: false, error: "Aucun apiculteur sélectionné." };
    const res = await fetch(`/api/apiculteurs/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: json.error };
    await fetchList();
    showNotice(`L'apiculteur "${values.name}" a été modifié.`);
    return { ok: true };
  }

  async function handleStatusChange(
    item: ApiculteurListItem,
    status: ApiculteurListItem["subscriptionStatus"]
  ) {
    const res = await fetch(`/api/apiculteurs/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionStatus: status }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: json.error };
    await fetchList();
    showNotice(statusChangeMessage(item.name, status));
    return { ok: true };
  }

  async function handleFermesChange(
    item: ApiculteurListItem,
    fermes: ApiculteurListItem["fermes"]
  ) {
    // Strip the temporary client-side ids the drawer assigns to new fermes;
    // the server will generate ObjectIds for them.
    const payload = fermes.map((f) =>
      f.id.startsWith("tmp-")
        ? {
            name: f.name,
            rucheCount: f.rucheCount,
            address: f.address,
            plusCode: f.plusCode,
            lat: f.lat,
            lng: f.lng,
          }
        : f
    );
    const res = await fetch(`/api/apiculteurs/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fermes: payload,
        // Keep the apiculteur's total ruche count in sync with the new fermes.
        rucheCount: payload.reduce((s, f) => s + (f.rucheCount ?? 0), 0),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: json.error };
    await fetchList();
    return { ok: true };
  }

  function downloadProfile(item: ApiculteurListItem) {
    const params = new URLSearchParams({ id: item.id });
    window.location.href = `/api/apiculteurs/export?${params.toString()}`;
  }

  async function confirmDeletion() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/apiculteurs/${confirmDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const removed = confirmDelete.name;
        if (selectedDetail?.id === confirmDelete.id) setSelectedDetail(null);
        await fetchList();
        setConfirmDelete(null);
        showNotice(`L'apiculteur "${removed}" a été supprimé.`);
      }
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(item: ApiculteurListItem) {
    setEditing(item);
    setFormOpen(true);
  }

  function downloadCsv() {
    const params = new URLSearchParams({ status });
    if (debouncedSearch) params.set("search", debouncedSearch);
    window.location.href = `/api/apiculteurs/export?${params.toString()}`;
  }

  const initialForm: Partial<ApiculteurFormValues> | undefined = editing
    ? {
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        region: editing.region,
        gender: editing.gender,
        subscriptionStatus: editing.subscriptionStatus,
        subscriptionPeriodMonths: editing.subscriptionPeriodMonths,
        avatarSrc:
          editing.avatarSrc &&
          editing.avatarSrc !== "/brand/avatar-sample.svg"
            ? editing.avatarSrc
            : "",
      }
    : undefined;

  const editStats = editing
    ? {
        fermeCount: editing.fermes?.length ?? editing.fermeCount ?? 0,
        rucheCount:
          (editing.fermes?.length ?? 0) > 0
            ? (editing.fermes ?? []).reduce(
                (s, f) => s + (f.rucheCount ?? 0),
                0
              )
            : editing.rucheCount,
        subscriptionEndsAt: editing.subscriptionEndsAt,
        subscriptionSuspendedAt: editing.subscriptionSuspendedAt,
        subscriptionRemainingMs: editing.subscriptionRemainingMs,
      }
    : undefined;

  return (
    <>
      {/* Bottom-right toast — matches the Figma "Notification après …"
          treatment. Compact pill, purple background, click-to-dismiss. */}
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
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 lg:text-h2">
            Gestion d&apos;abonnements
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-500">
            <span>{data ? `${fmtCount(data.totalAll)} apiculteurs` : "…"}</span>
            <span className="h-1 w-1 rounded-full bg-ink-300" />
            <span>
              {data ? `${fmtCount(data.totalActive)} actives` : "…"}
            </span>
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </header>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Apiculteur"
          value={data?.totalAll ?? "…"}
          icon={<Users className="h-4 w-4" />}
          trend={
            data
              ? { value: data.monthly.apiculteurs, suffix: "ce mois" }
              : undefined
          }
        />
        <StatCard
          label="Ruches Totales"
          value={data?.totalRuches ?? "…"}
          icon={<Wheat className="h-4 w-4" />}
          tone="orange"
          trend={
            data
              ? {
                  value: -2, // demo delta — replace with real metric later
                  suffix: "ce mois",
                }
              : undefined
          }
        />
        <StatCard
          label="Fermes"
          value={data?.totalFermes ?? "…"}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="Abonnements actifs"
          value={data?.totalActive ?? "…"}
          icon={<CreditCard className="h-4 w-4" />}
          trend={
            data
              ? {
                  value: data.monthly.activeSubscriptions,
                  suffix: "ce mois",
                }
              : undefined
          }
        />
      </div>

      {/* Two-column layout (desktop). On mobile, the right column is hidden. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* LEFT — filters + list */}
        <div className="min-w-0">
          {/* Filters bar — desktop */}
          <div className="mb-4 hidden flex-wrap items-center justify-between gap-3 lg:flex">
            <div className="flex flex-wrap items-center gap-3">
              <SelectPill
                variant="segmented"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => setStatus(v as StatusFilter)}
              />
              <ApiculteurDateFilter
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
              <div className="flex h-9 w-72 max-w-full items-center gap-2 rounded-full border border-ink-200 bg-white px-4">
                <Search className="h-4 w-4 text-ink-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, Email…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
                />
              </div>
            </div>
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={downloadCsv}
            >
              Télécharger
            </Button>
          </div>

          {/* Filters bar — mobile */}
          <div className="mb-4 lg:hidden">
            {mobileSearchOpen ? (
              <div className="flex h-12 items-center gap-2 rounded-pill bg-white px-3 shadow-card">
                <Search className="h-4 w-4 shrink-0 text-ink-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, Email…"
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
                  <ApiculteurDateFilter
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

          {/* Mobile cards (< lg) */}
          <div className="space-y-3 lg:hidden">
            {loading && (
              <SkeletonState>Chargement…</SkeletonState>
            )}
            {!loading && error && (
              <SkeletonState variant="error">{error}</SkeletonState>
            )}
            {!loading && !error && data?.items.length === 0 && (
              <SkeletonState>
                Aucun apiculteur ne correspond aux filtres.
              </SkeletonState>
            )}
            {!loading &&
              !error &&
              data?.items.map((it) => (
                <ApiculteurCardMobile
                  key={it.id}
                  item={it}
                  expanded={expandedId === it.id}
                  onToggle={() =>
                    setExpandedId((c) => (c === it.id ? null : it.id))
                  }
                  onOpenDetails={() => openDrawer(it)}
                  onEdit={() => openEdit(it)}
                  onDelete={() => setConfirmDelete(it)}
                />
              ))}
            {data && data.total > 0 && (
              <div className="mt-2 rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink-500">
                    {startIdx}-{endIdx} sur {data.total}
                  </span>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    size="sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Desktop table (≥ lg) */}
          <div className="hidden lg:block">
            <Table>
              <TableHead>
                <Th className="w-10">
                  <CellCheckbox
                    checked={allOnPageSelected}
                    onChange={(v) => toggleAllOnPage(v)}
                  />
                </Th>
                <Th>
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap uppercase tracking-[0.08em]"
                  >
                    Nom &amp; email
                    <SortIndicator
                      active={sortBy === "name"}
                      dir={sortDir}
                    />
                  </button>
                </Th>
                <Th>Téléphone</Th>
                <Th className="whitespace-nowrap">Genre</Th>
                <Th>
                  <button
                    type="button"
                    onClick={() => toggleSort("rucheCount")}
                    className="inline-flex items-center gap-1.5 uppercase tracking-[0.08em]"
                  >
                    Ruches
                    <SortIndicator
                      active={sortBy === "rucheCount"}
                      dir={sortDir}
                    />
                  </button>
                </Th>
                <Th>
                  <button
                    type="button"
                    onClick={() => toggleSort("subscriptionEndsAt")}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap uppercase tracking-[0.08em]"
                  >
                    Abonnement
                    <SortIndicator
                      active={sortBy === "subscriptionEndsAt"}
                      dir={sortDir}
                    />
                  </button>
                </Th>
                <Th>Statue</Th>
                <Th className="w-12"></Th>
              </TableHead>
              <TableBody>
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-16 text-center text-sm text-ink-500"
                    >
                      Chargement…
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-16 text-center text-sm text-brand-orange"
                    >
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && data?.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-16 text-center text-sm text-ink-500"
                    >
                      Aucun apiculteur ne correspond aux filtres.
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  data?.items.map((it) => {
                    const isSel = selected.has(it.id);
                    const isFocused = selectedDetail?.id === it.id;
                    return (
                      <TableRow
                        key={it.id}
                        selected={isSel || isFocused}
                        onClick={() => setSelectedDetail(it)}
                        onDoubleClick={() => openDrawer(it)}
                        className="cursor-pointer select-none"
                      >
                        <Td onClick={(e) => e.stopPropagation()}>
                          <CellCheckbox
                            checked={isSel}
                            onChange={(v) => toggleOne(it.id, v)}
                          />
                        </Td>
                        <Td>
                          <CellAvatar
                            initials={initialsOf(it.name)}
                            label={it.name}
                            src={it.avatarSrc}
                          />
                          <div className="ml-11 -mt-0.5 truncate text-xs text-ink-500">
                            {it.email}
                          </div>
                        </Td>
                        <Td className="text-ink-700">{it.phone || "—"}</Td>
                        <Td>
                          <GenderPill gender={it.gender} />
                        </Td>
                        <Td>
                          <CellNumber n={it.rucheCount} />
                        </Td>
                        <Td className="text-ink-700">
                          <DateRangeCell
                            start={it.subscriptionStartedAt}
                            end={it.subscriptionEndsAt}
                          />
                        </Td>
                        <Td>
                          <CellStatus variant={it.subscriptionStatus} />
                        </Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDrawer(it)}
                              aria-label="Voir les détails"
                              title="Voir les détails"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-ink-500 transition-colors hover:bg-primary-100 hover:text-brand-purple"
                            >
                              <UserIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(it)}
                              aria-label="Modifier"
                              title="Modifier"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-brand-purple transition-colors hover:bg-primary-100"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </Td>
                      </TableRow>
                    );
                  })}
              </TableBody>
              {data && data.total > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={8} className="p-0">
                      <TableFooter>
                        <span className="text-sm text-ink-500">
                          {startIdx}-{endIdx} sur {data.total}
                        </span>
                        <Pagination
                          page={page}
                          totalPages={totalPages}
                          onPageChange={setPage}
                        />
                      </TableFooter>
                    </td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        </div>

        {/* RIGHT — map + detail panel (desktop only) */}
        <aside className="hidden flex-col gap-5 lg:flex">
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <header className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  Répartitions géographique
                </h3>
                <p className="text-xs text-ink-500">
                  {data ? `${data.mapPoints.length} apiculteurs` : "…"}
                </p>
              </div>
            </header>
            <OverviewMap
              points={data?.mapPoints ?? []}
              selectedId={selectedDetail?.id}
              onSelect={(id) => {
                const found = data?.items.find((i) => i.id === id);
                if (found) openDrawer(found);
              }}
              className="aspect-[3/4]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <OverviewMapLegend variant="suspended" label="Suspendu" />
              <OverviewMapLegend variant="active" label="Active" />
              <OverviewMapLegend variant="expired" label="Expiré" />
            </div>
          </div>

          <ApiculteurDetailPanel
            selected={selectedDetail}
            onClose={() => setSelectedDetail(null)}
            onEdit={() => selectedDetail && openDrawer(selectedDetail)}
            onDelete={() =>
              selectedDetail && setConfirmDelete(selectedDetail)
            }
          />
        </aside>
      </div>

      {/* Rich detail drawer — slides in from the right */}
      <ApiculteurDetailDrawer
        open={drawerOpen}
        apiculteur={selectedDetail}
        onClose={closeDrawer}
        onDelete={(item) => {
          closeDrawer();
          setConfirmDelete(item);
        }}
        onStatusChange={handleStatusChange}
        onFermesChange={handleFermesChange}
        onEdit={(item) => {
          closeDrawer();
          openEdit(item);
        }}
        onDownload={downloadProfile}
      />

      {/* Create / edit modal */}
      <ApiculteurFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={editing ? "edit" : "create"}
        initial={initialForm}
        stats={editStats}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      {/* Delete confirmation */}
      <Confirmation
        open={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        variant="danger"
        icon={<Trash2 className="h-5 w-5" />}
        title="Supprimer cet apiculteur ?"
        description={
          confirmDelete
            ? `Le compte de ${confirmDelete.name} sera définitivement supprimé. Cette action est irréversible.`
            : ""
        }
        secondaryLabel="Annuler"
        primaryLabel={deleting ? "Suppression…" : "Supprimer"}
        loading={deleting}
        onPrimary={confirmDeletion}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function SkeletonState({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "error";
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
 * Toast wording for each subscription status transition. Uses the
 * exact strings agreed with the design — active / expired / suspended.
 */
function statusChangeMessage(
  name: string,
  status: ApiculteurListItem["subscriptionStatus"]
): string {
  switch (status) {
    case "active":
      return `L'abonnement de l'apiculteur "${name}" a été activé avec succès.`;
    case "expired":
      return `L'abonnement de l'apiculteur "${name}" est désormais expiré.`;
    case "suspended":
      return `L'abonnement de l'apiculteur "${name}" a été suspendu avec succès.`;
  }
}

/**
 * Two-line "Du JJ/MM/AA — Au JJ/MM/AA" date range for the desktop table.
 * Falls back to "—" for either side when missing.
 */
function DateRangeCell({
  start,
  end,
}: {
  start: string | null;
  end: string | null;
}) {
  const startLabel = start ? formatFR(new Date(start)) : "—";
  const endLabel = end ? formatFR(new Date(end)) : "—";
  return (
    <div className="inline-flex flex-col gap-0.5 whitespace-nowrap leading-tight">
      <span className="flex items-baseline gap-1.5">
        <span className="w-5 shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
          Du
        </span>
        <span className="text-sm font-medium text-ink-800">{startLabel}</span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="w-5 shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
          Au
        </span>
        <span className="text-sm font-medium text-ink-800">{endLabel}</span>
      </span>
    </div>
  );
}

/**
 * Compact gender chip for the table. Male → blue tone, female → pink
 * tone, unknown → neutral. Designed to read at a glance and to fit on
 * the same row height as the surrounding text cells.
 */
function GenderPill({ gender }: { gender: "male" | "female" | "unknown" }) {
  if (gender === "male") {
    return (
      <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-600">
        Homme
      </span>
    );
  }
  if (gender === "female") {
    return (
      <span className="inline-flex items-center rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-pink-600">
        Femme
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-500">
      —
    </span>
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
        "inline-flex flex-col text-[8px] leading-[8px]",
        active ? "text-brand-purple" : "text-ink-400"
      )}
    >
      <span
        className={cn(dir === "asc" && active ? "opacity-100" : "opacity-50")}
      >
        ▲
      </span>
      <span
        className={cn(dir === "desc" && active ? "opacity-100" : "opacity-50")}
      >
        ▼
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                            ApiculteurCardMobile                            */
/* -------------------------------------------------------------------------- */

interface CardProps {
  item: ApiculteurListItem;
  expanded: boolean;
  onToggle: () => void;
  onOpenDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ApiculteurCardMobile({
  item,
  expanded,
  onToggle,
  onOpenDetails,
  onEdit,
  onDelete,
}: CardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <Avatar
          initials={initialsOf(item.name)}
          src={
            item.avatarSrc && item.avatarSrc !== "/brand/avatar-sample.svg"
              ? item.avatarSrc
              : undefined
          }
          alt={item.name}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">
            {item.name}
          </p>
          <p className="truncate text-sm text-ink-500">{item.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge variant={item.subscriptionStatus} />
            <GenderPill gender={item.gender} />
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-ink-400" strokeWidth={2.5} />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-ink-400" strokeWidth={2.5} />
        )}
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-ink-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-ink-700">
            <Phone className="h-4 w-4 shrink-0 text-ink-400" />
            <span className="truncate">{item.phone || "—"}</span>
          </p>
          <p className="flex items-center gap-2 text-sm text-ink-700">
            <Wheat className="h-4 w-4 shrink-0 text-ink-400" />
            <span>{String(item.rucheCount).padStart(2, "0")} ruches</span>
          </p>
          <p className="flex items-start gap-2 text-sm text-ink-700">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] uppercase tracking-[0.06em] text-ink-400">
                Du{" "}
                <span className="text-ink-700">
                  {item.subscriptionStartedAt
                    ? formatFR(new Date(item.subscriptionStartedAt))
                    : "—"}
                </span>
              </span>
              <span className="text-[11px] uppercase tracking-[0.06em] text-ink-400">
                Au{" "}
                <span className="text-ink-700">
                  {item.subscriptionEndsAt
                    ? formatFR(new Date(item.subscriptionEndsAt))
                    : "—"}
                </span>
              </span>
            </span>
          </p>
          <button
            type="button"
            onClick={onOpenDetails}
            className="w-full rounded-pill border border-ink-200 px-3 py-2 text-xs font-medium text-ink-600 transition-colors hover:border-brand-purple hover:bg-primary-50 hover:text-brand-purple"
          >
            Voir les détails
          </button>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onDelete}
              aria-label="Supprimer"
              className="flex h-10 flex-1 items-center justify-center rounded-pill bg-brand-orange text-white transition-colors hover:bg-brand-orange-hover"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              aria-label="Modifier"
              className="flex h-10 flex-1 items-center justify-center rounded-pill bg-brand-purple text-white transition-colors hover:bg-brand-purple-hover"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          ApiculteurDateFilter                              */
/* -------------------------------------------------------------------------- */

interface DateFilterProps {
  label: string;
  active: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterType: DateFilterType;
  onChangeFilterType: (v: DateFilterType) => void;
  date: Date | null;
  onChangeDate: (d: Date | null) => void;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onChangeRange: (start: Date | null, end: Date | null) => void;
  onClear: () => void;
  compact?: boolean;
}

function ApiculteurDateFilter({
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
          <span className="max-w-[140px] truncate">{label}</span>
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
