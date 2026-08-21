"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Select } from "@/components/ui/Select";
import { SelectPill } from "@/components/ui/SelectPill";
import { Pagination } from "@/components/ui/Pagination";
import {
  ArrowRight,
  ArrowUpDown,
  Search,
  X,
} from "@/lib/icons";
import { cn } from "@/lib/cn";
import { TUNISIA_REGION_OPTIONS } from "@/lib/tunisia";
import type { RucheListItem, RucheListPayload } from "@/lib/ruches/types";
import { RucheDetailDrawer } from "./RucheDetailDrawer";
import type { RucheRow } from "./types";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

type StatusFilter = "all" | "alerte" | "normale";
type SortBy = "nom" | "ferme" | "localisation";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous", tone: "purple" as const },
  { value: "alerte", label: "Alerte", tone: "orange" as const },
  { value: "normale", label: "Normale", tone: "purple" as const },
];

const PAGE_SIZE = 12;

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

/** API row → view-model row consumed by the table & detail drawer. */
function toRucheRow(item: RucheListItem): RucheRow {
  return {
    id: item.id,
    name: item.name,
    fermeId: item.fermeId,
    fermeName: item.fermeName,
    region: item.region,
    pays: item.pays,
    localisation: item.localisation,
    gatewayLabel: item.gatewayLabel,
    gatewayIndex: item.gatewayIndex,
    status: item.status,
    alerts: item.alerts,
    lat: item.lat,
    lng: item.lng,
  };
}

export function MesRuchesClient() {
  /** Current page of ruches returned by the API. */
  const [data, setData] = useState<RucheListPayload | null>(null);
  /** Full ruches list cached for the detail drawer sub-table. */
  const [allRowsAll, setAllRowsAll] = useState<RucheRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("nom");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [detailRow, setDetailRow] = useState<RucheRow | null>(null);

  // Debounce the search input.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => window.clearTimeout(t);
  }, [search]);

  // Reset to first page when filters change.
  useEffect(() => {
    setPage(1);
  }, [status, region, debouncedSearch, sortBy, sortDir]);

  const fetchRuches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      params.set("status", status);
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      if (region) params.set("region", region);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/ruches?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Impossible de charger vos ruches.");
      }
      const json = (await res.json()) as RucheListPayload;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, status, region, debouncedSearch, sortBy, sortDir]);

  // Separately pull the full list once (no pagination) for the detail
  // drawer's "other ruches in this ferme" sub-table.
  const fetchAllRuches = useCallback(async () => {
    try {
      const res = await fetch(`/api/ruches?page=1&pageSize=200&status=all`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as RucheListPayload;
      setAllRowsAll(json.items.map(toRucheRow));
    } catch {
      // best-effort; drawer falls back to whatever's currently paginated.
    }
  }, []);

  useEffect(() => {
    void fetchRuches();
  }, [fetchRuches]);

  useEffect(() => {
    void fetchAllRuches();
  }, [fetchAllRuches]);

  const paginatedRows = useMemo<RucheRow[]>(
    () => (data?.items ?? []).map(toRucheRow),
    [data]
  );
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startRow = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endRow = Math.min(page * PAGE_SIZE, total);
  const totalRuches = data?.totalAll ?? 0;
  const totalAttention = data?.totalAttention ?? 0;

  function toggleSort(next: SortBy) {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(next);
      setSortDir("asc");
    }
  }

  return (
    <>
      <PageHeader
        title="Mes ruches"
        subtitle={`${String(totalRuches).padStart(2, "0")} Ruches · ${String(
          totalAttention
        ).padStart(2, "0")} en alerte`}
      />

      {/* Filters — desktop */}
      <div className="mb-4 hidden flex-wrap items-center justify-between gap-3 lg:flex">
        <div className="flex flex-wrap items-center gap-3">
          <SelectPill
            variant="segmented"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
          />
          <FilterSelect
            placeholder="Sélectionner une région"
            value={region}
            options={TUNISIA_REGION_OPTIONS}
            onChange={setRegion}
            onClear={() => setRegion("")}
          />
        </div>
        <div className="flex h-9 w-72 max-w-full items-center gap-2 rounded-full border border-ink-200 bg-white px-4">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, ferme, gateway…"
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
              placeholder="Nom, ferme…"
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

      {/* Table */}
      <div className="w-full overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                <ThCell onSort={() => toggleSort("nom")} active={sortBy === "nom"}>
                  RUCHES
                </ThCell>
                <ThCell onSort={() => toggleSort("ferme")} active={sortBy === "ferme"}>
                  FERME
                </ThCell>
                <ThCell
                  onSort={() => toggleSort("localisation")}
                  active={sortBy === "localisation"}
                >
                  LOCALISATION
                </ThCell>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                  GATEWAY
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                  ALERTES
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                  STATUE
                </th>
                <th className="w-12 px-2 py-4" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-ink-500">
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-brand-orange">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-ink-500">
                    Aucune ruche ne correspond aux filtres.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-ink-100 transition-colors last:border-b-0 hover:bg-ink-50/60"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-ink-900">
                      {row.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                      {row.fermeName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                      {row.region} - {row.pays}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-6 items-center justify-center rounded-full bg-primary-100 px-2.5 text-xs font-semibold text-brand-purple">
                        {row.gatewayLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AlertsPill count={row.alerts} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="w-12 px-2 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setDetailRow(row)}
                          aria-label={`Ouvrir ${row.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-brand-purple transition-colors hover:bg-primary-100"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={total > 0 ? `${startRow}-${endRow} sur ${total}` : "—"}
        />
      </div>

      <RucheDetailDrawer
        open={detailRow !== null}
        row={detailRow}
        ruches={allRowsAll.length > 0 ? allRowsAll : paginatedRows}
        onClose={() => setDetailRow(null)}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                */
/* -------------------------------------------------------------------------- */

function ThCell({
  children,
  active,
  onSort,
}: {
  children: React.ReactNode;
  active: boolean;
  onSort: () => void;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
      <button
        type="button"
        onClick={onSort}
        className="inline-flex items-center gap-1.5"
      >
        {children}
        <ArrowUpDown
          className={cn(
            "h-3 w-3",
            active ? "text-brand-purple" : "text-ink-400"
          )}
        />
      </button>
    </th>
  );
}

function FilterSelect({
  placeholder,
  value,
  options,
  onChange,
  onClear,
}: {
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <Select
        placeholder={placeholder}
        options={options}
        value={value}
        onChange={onChange}
        className="min-w-[220px]"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Réinitialiser le filtre"
          className="absolute right-9 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full text-ink-400 transition-colors hover:text-brand-purple"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function AlertsPill({ count }: { count: number }) {
  if (count <= 0) {
    return <span className="text-sm text-ink-500">0</span>;
  }
  return (
    <span className="inline-flex items-center rounded-md bg-brand-orange px-3 py-1 text-xs font-semibold text-white">
      {String(count).padStart(2, "0")} Alertes
    </span>
  );
}

function StatusPill({ status }: { status: "alerte" | "normale" }) {
  if (status === "alerte") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-[#9B5A1F]">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
        Alerte
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-brand-purple">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />
      Normale
    </span>
  );
}
