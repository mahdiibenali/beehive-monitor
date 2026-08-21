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
  CellActions,
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
  Download,
  Edit,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from "@/lib/icons";
import { formatFR } from "@/lib/calendar";
import type { AdminListItem } from "@/lib/admins/serializer";
import {
  AdminFormModal,
  type AdminFormValues,
} from "./AdminFormModal";
import { cn } from "@/lib/cn";

type StatusFilter = "all" | "active" | "disabled";
type SortBy = "name" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 9;

const STATUS_OPTIONS = [
  { value: "all", label: "Tous", tone: "purple" as const },
  { value: "active", label: "Active", tone: "purple" as const },
  { value: "disabled", label: "Désactivé", tone: "red" as const },
];

interface ListPayload {
  items: AdminListItem[];
  total: number;
  totalAll: number;
  totalActive: number;
  page: number;
  pageSize: number;
}

export function AdminsClient() {
  const [data, setData] = useState<ListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("est");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminListItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Deep-link support — `/admins?open=<id>` (e.g. from a notification)
  // opens the edit modal for that admin. We try the current page first
  // then fall back to a single-item fetch, and clean the URL up so
  // a refresh doesn't reopen the modal.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledOpenIdRef = useRef<string | null>(null);

  // Top notice (shown after a successful create / update / delete)
  const [notice, setNotice] = useState<string | null>(null);

  // Mobile UI state — search panel + expanded card
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice((current) => (current === message ? null : current));
    }, 5000);
  }

  // Debounce the search input by 250ms to avoid hammering the API.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, dateFilterType, filterDate, rangeStart, rangeEnd, sortBy, sortDir]);

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

      const res = await fetch(`/api/admins?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ListPayload & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erreur de chargement.");
        return;
      }
      setData(json);
      // Drop selection IDs that aren't in the new page.
      setSelected((prev) => {
        const next = new Set<string>();
        for (const it of json.items) if (prev.has(it.id)) next.add(it.id);
        return next;
      });
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch, sortBy, sortDir, dateFilterType, filterDate, rangeStart, rangeEnd]);

  function clearDateFilter() {
    setFilterDate(null);
    setRangeStart(null);
    setRangeEnd(null);
  }

  function handleDateFilterTypeChange(next: DateFilterType) {
    setDateFilterType(next);
    if (next === "est-entre") {
      setFilterDate(null);
    } else {
      setRangeStart(null);
      setRangeEnd(null);
    }
  }

  const dateTriggerLabel = useMemo(() => {
    if (dateFilterType === "est-entre") {
      if (rangeStart && rangeEnd) {
        return `${formatFR(rangeStart)} – ${formatFR(rangeEnd)}`;
      }
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

  // Deep-link: open the edit modal for `?open=<id>` once the data is in.
  useEffect(() => {
    const openId = searchParams?.get("open");
    if (!openId || handledOpenIdRef.current === openId) return;

    const local = data?.items.find((it) => it.id === openId);
    if (local) {
      handledOpenIdRef.current = openId;
      setEditing(local);
      setFormOpen(true);
      router.replace(pathname, { scroll: false });
      return;
    }

    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/admins/${openId}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const payload = (await res.json()) as { item?: AdminListItem };
        if (payload.item) {
          handledOpenIdRef.current = openId;
          setEditing(payload.item);
          setFormOpen(true);
          router.replace(pathname, { scroll: false });
        }
      } catch {
        // Aborted or network error — silently ignore.
      }
    })();
    return () => ctrl.abort();
  }, [searchParams, data, router, pathname]);

  function toggleSort(col: SortBy) {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
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
    !!data && data.items.length > 0 && data.items.every((i) => selected.has(i.id));

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

  async function handleCreate(values: AdminFormValues) {
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: json.error };
    await fetchList();
    showNotice(`Le compte administrateur "${values.name}" a été créé avec succès !`);
    return { ok: true };
  }

  async function handleUpdate(values: AdminFormValues) {
    if (!editing) return { ok: false, error: "Aucun admin sélectionné." };
    const payload: Partial<AdminFormValues> = { ...values };
    if (!payload.password) delete payload.password;
    const res = await fetch(`/api/admins/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: json.error };
    await fetchList();
    showNotice(`Le compte administrateur "${values.name}" a été modifié.`);
    return { ok: true };
  }

  async function toggleActive(item: AdminListItem) {
    const res = await fetch(`/api/admins/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) await fetchList();
  }

  async function confirmDeletion() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admins/${confirmDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const removedName = confirmDelete.name;
        await fetchList();
        setConfirmDelete(null);
        showNotice(`Le compte administrateur "${removedName}" a été supprimé.`);
      }
    } finally {
      setDeleting(false);
    }
  }

  function downloadCsv() {
    const params = new URLSearchParams({ status });
    window.location.href = `/api/admins/export?${params.toString()}`;
  }

  const stats = useMemo(() => {
    if (!data) return null;
    const fmt = (n: number) => String(n).padStart(2, "0");
    return { all: fmt(data.totalAll), active: fmt(data.totalActive) };
  }, [data]);

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
            Gestion des Comptes Admin
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-500">
            <span>{stats ? `${stats.all} comptes` : "…"}</span>
            <span className="h-1 w-1 rounded-full bg-ink-300" />
            <span>{stats ? `${stats.active} Actives` : "…"}</span>
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </header>

      {/* Filters bar — desktop (≥ lg) */}
      <div className="mb-4 hidden flex-wrap items-center justify-between gap-3 lg:flex">
        <div className="flex flex-wrap items-center gap-3">
          <SelectPill
            variant="segmented"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
          />
          <AdminDateFilter
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
            onChangeRange={(start, end) => {
              setRangeStart(start);
              setRangeEnd(end);
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
              placeholder="Nom, Email…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
            />
          </div>
          <Button
            variant="secondary"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={downloadCsv}
          >
            Télécharger
          </Button>
        </div>
      </div>

      {/* Filters bar — mobile (< lg) */}
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
              <AdminDateFilter
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
                onChangeRange={(start, end) => {
                  setRangeStart(start);
                  setRangeEnd(end);
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

      {/* Card list — mobile (< lg) */}
      <div className="space-y-3 lg:hidden">
        {loading && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-card">
            Chargement…
          </div>
        )}
        {!loading && error && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-brand-orange shadow-card">
            {error}
          </div>
        )}
        {!loading && !error && data?.items.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-card">
            Aucun administrateur ne correspond aux filtres.
          </div>
        )}
        {!loading &&
          !error &&
          data?.items.map((it) => (
            <AdminCardMobile
              key={it.id}
              item={it}
              expanded={expandedId === it.id}
              onToggle={() =>
                setExpandedId((current) => (current === it.id ? null : it.id))
              }
              onEdit={() => {
                setEditing(it);
                setFormOpen(true);
              }}
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

      {/* Table — desktop (≥ lg) */}
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
              className="inline-flex items-center gap-1.5 uppercase tracking-[0.08em]"
            >
              Noms et prénoms
              <SortIndicator active={sortBy === "name"} dir={sortDir} />
            </button>
          </Th>
          <Th>E-mail</Th>
          <Th>Numéro de tél.</Th>
          <Th>
            <button
              type="button"
              onClick={() => toggleSort("createdAt")}
              className="inline-flex items-center gap-1.5 uppercase tracking-[0.08em]"
            >
              Date
              <SortIndicator active={sortBy === "createdAt"} dir={sortDir} />
            </button>
          </Th>
          <Th>Statue</Th>
          <Th>Actions</Th>
        </TableHead>
        <TableBody>
          {loading && (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-16 text-center text-sm text-ink-500"
              >
                Chargement…
              </td>
            </tr>
          )}
          {!loading && error && (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-16 text-center text-sm text-brand-orange"
              >
                {error}
              </td>
            </tr>
          )}
          {!loading && !error && data?.items.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-16 text-center text-sm text-ink-500"
              >
                Aucun administrateur ne correspond aux filtres.
              </td>
            </tr>
          )}
          {!loading &&
            !error &&
            data?.items.map((it) => {
              const isSel = selected.has(it.id);
              return (
                <TableRow key={it.id} selected={isSel}>
                  <Td>
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
                  </Td>
                  <Td className="text-ink-700">{it.email}</Td>
                  <Td className="text-ink-700">{it.phone || "—"}</Td>
                  <Td className="text-ink-700">
                    {formatFR(new Date(it.createdAt))}
                  </Td>
                  <Td>
                    <CellStatus variant={it.isActive ? "active" : "disabled"} />
                  </Td>
                  <Td>
                    <CellActions
                      onEdit={() => {
                        setEditing(it);
                        setFormOpen(true);
                      }}
                      onDelete={() => setConfirmDelete(it)}
                      onRestore={() => toggleActive(it)}
                    />
                  </Td>
                </TableRow>
              );
            })}
        </TableBody>
        {data && data.total > 0 && (
          <tfoot>
            <tr>
              <td colSpan={7} className="p-0">
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

      {/* Create / edit modal */}
      <AdminFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={editing ? "edit" : "create"}
        initial={
          editing
            ? {
                name: editing.name,
                email: editing.email,
                phone: editing.phone,
                isActive: editing.isActive,
                password: "",
                avatarSrc:
                  editing.avatarSrc &&
                  editing.avatarSrc !== "/brand/avatar-sample.svg"
                    ? editing.avatarSrc
                    : "",
              }
            : undefined
        }
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      {/* Delete confirmation */}
      <Confirmation
        open={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        variant="danger"
        icon={<Trash2 className="h-5 w-5" />}
        title="Supprimer cet administrateur ?"
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

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span
      className={cn(
        "inline-flex flex-col text-[8px] leading-[8px]",
        active ? "text-brand-purple" : "text-ink-400"
      )}
    >
      <span className={cn(dir === "asc" && active ? "opacity-100" : "opacity-50")}>
        ▲
      </span>
      <span className={cn(dir === "desc" && active ? "opacity-100" : "opacity-50")}>
        ▼
      </span>
    </span>
  );
}

interface AdminDateFilterProps {
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
  /**
   * When true, render an icon-only round trigger button (used on mobile).
   * The dropdown anchors to the right edge so it stays inside the viewport.
   */
  compact?: boolean;
}

/**
 * Compact pill trigger (Figma filter bar) that opens the kit `DatePicker`
 * — same component as `/style-guide` (Est / Est entre / Avant / Après).
 */
function AdminDateFilter({
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
}: AdminDateFilterProps) {
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

/* -------------------------------------------------------------------------- */
/*                              AdminCardMobile                               */
/* -------------------------------------------------------------------------- */

interface AdminCardMobileProps {
  item: AdminListItem;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Mobile-only collapsible card replacing a desktop table row.
 * Collapsed: avatar + name + email + status pill + chevron.
 * Expanded: also shows phone, creation date, and the two action buttons
 * (delete = orange, edit = purple) — matches the Figma mobile design.
 */
function AdminCardMobile({
  item,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: AdminCardMobileProps) {
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
          <div className="mt-2">
            <StatusBadge variant={item.isActive ? "active" : "disabled"} />
          </div>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-ink-400 transition-transform",
            expanded && "rotate-180"
          )}
          strokeWidth={2.5}
        />
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-ink-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-ink-700">
            <Phone className="h-4 w-4 shrink-0 text-ink-400" />
            <span className="truncate">{item.phone || "—"}</span>
          </p>
          <p className="flex items-center gap-2 text-sm text-ink-700">
            <Calendar className="h-4 w-4 shrink-0 text-ink-400" />
            <span>{formatFR(new Date(item.createdAt))}</span>
          </p>
          <div className="flex gap-2 pt-2">
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
