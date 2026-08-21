"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SelectPill } from "@/components/ui/SelectPill";
import { Pagination } from "@/components/ui/Pagination";
import { Alert } from "@/components/ui/Alert";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from "@/components/ui/Table";
import {
  ArrowRight,
  ArrowUpDown,
  Plus,
  Search,
  X,
} from "@/lib/icons";
import { cn } from "@/lib/cn";
import { TUNISIA_REGION_OPTIONS } from "@/lib/tunisia";
import type { FermeListItem, FermeListPayload } from "@/lib/fermes/types";
import {
  FermeFormModal,
  type FermeFormValues,
} from "@/app/(app)/apiculteurs/_components/FermeFormModal";
import { FermeDetailDrawer } from "./FermeDetailDrawer";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

type StatusFilter = "all" | "alerte" | "normale";
type SortBy = "nom" | "localisation";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous", tone: "purple" as const },
  { value: "alerte", label: "Alerte", tone: "orange" as const },
  { value: "normale", label: "Normale", tone: "purple" as const },
];

const PAGE_SIZE = 9;

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

export function FermesClient() {
  const [data, setData] = useState<FermeListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("nom");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [detailFerme, setDetailFerme] = useState<FermeListItem | null>(null);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(
      () => setNotice((curr) => (curr === message ? null : curr)),
      4500
    );
  }

  // Debounce the search input.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => window.clearTimeout(t);
  }, [search]);

  // Reset to first page whenever any filter changes.
  useEffect(() => {
    setPage(1);
  }, [status, region, debouncedSearch, sortBy, sortDir]);

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
      if (region) params.set("region", region);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/fermes?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? "Impossible de charger les fermes.");
      }
      const json = (await res.json()) as FermeListPayload;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, status, region, debouncedSearch, sortBy, sortDir]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const paginatedRows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startRow = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endRow = Math.min(page * PAGE_SIZE, total);
  const totalFermes = data?.totalAll ?? 0;
  const totalAttention = data?.totalAttention ?? 0;

  function toggleSort(next: SortBy) {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(next);
      setSortDir("asc");
    }
  }

  async function handleCreateFerme(
    values: FermeFormValues
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch("/api/fermes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          rucheCount: values.rucheCount,
          address: values.address,
          plusCode: values.plusCode,
          lat: values.lat,
          lng: values.lng,
          gatewayCount: 1,
          ruchesAttention: 0,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return { ok: false, error: json.error };
      setFormOpen(false);
      showNotice(`La ferme "${values.name}" a été ajoutée.`);
      void fetchList();
      return { ok: true };
    } catch {
      return { ok: false, error: "Erreur réseau." };
    }
  }

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

      <PageHeader
        title="Fermes"
        subtitle={`${String(totalFermes).padStart(2, "0")} Fermes · ${String(
          totalAttention
        ).padStart(2, "0")} Ruches nécessitent de l'attention`}
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setFormOpen(true)}
          >
            Ajouter
          </Button>
        }
      />

      <FermeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode="create"
        onSubmit={handleCreateFerme}
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
            placeholder="Nom,Email…"
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
              placeholder="Nom, région…"
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
      <Table>
        <TableHead>
          <Th>
            <button
              type="button"
              onClick={() => toggleSort("nom")}
              className="inline-flex items-center gap-1.5 text-left"
            >
              FERMES
              <ArrowUpDown
                className={cn(
                  "h-3 w-3",
                  sortBy === "nom" ? "text-brand-purple" : "text-ink-400"
                )}
              />
            </button>
          </Th>
          <Th>
            <button
              type="button"
              onClick={() => toggleSort("localisation")}
              className="inline-flex items-center gap-1.5 text-left"
            >
              LOCALISATION
              <ArrowUpDown
                className={cn(
                  "h-3 w-3",
                  sortBy === "localisation"
                    ? "text-brand-purple"
                    : "text-ink-400"
                )}
              />
            </button>
          </Th>
          <Th className="text-center">GATEWAY</Th>
          <Th className="text-center">RUCHES</Th>
          <Th>RUCHES QUI NÉCESSITENT DE L&apos;ATTENTION</Th>
          <Th>STATUE</Th>
          <Th className="w-12" />
        </TableHead>
        <TableBody>
          {loading && (
            <TableRow>
              <Td colSpan={7}>
                <div className="py-10 text-center text-sm text-ink-500">
                  Chargement…
                </div>
              </Td>
            </TableRow>
          )}
          {!loading && error && (
            <TableRow>
              <Td colSpan={7}>
                <div className="py-10 text-center text-sm text-brand-orange">
                  {error}
                </div>
              </Td>
            </TableRow>
          )}
          {!loading && !error && paginatedRows.length === 0 && (
            <TableRow>
              <Td colSpan={7}>
                <div className="py-10 text-center text-sm text-ink-500">
                  Aucune ferme ne correspond aux filtres.
                </div>
              </Td>
            </TableRow>
          )}
          {!loading &&
            !error &&
            paginatedRows.map((row) => (
              <TableRow key={row.id}>
                <Td className="font-medium text-ink-900">{row.nom}</Td>
                <Td className="text-ink-700">
                  {row.region} - {row.pays}
                </Td>
                <Td className="text-center">
                  <CountPill value={row.gateway} />
                </Td>
                <Td className="text-center">
                  <CountPill value={row.ruches} />
                </Td>
                <Td>
                  <AttentionPill count={row.ruchesAttention} />
                </Td>
                <Td>
                  <StatusPill status={row.status} />
                </Td>
                <Td>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setDetailFerme(row)}
                      aria-label={`Ouvrir la ferme ${row.nom}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-brand-purple transition-colors hover:bg-primary-100"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Td>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <div className="mt-3">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={total > 0 ? `${startRow}-${endRow} sur ${total}` : "—"}
        />
      </div>

      <FermeDetailDrawer
        open={detailFerme !== null}
        ferme={detailFerme}
        onClose={() => setDetailFerme(null)}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                */
/* -------------------------------------------------------------------------- */

/** A clearable wrapper around `<Select>` for the country / region filters. */
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

function CountPill({ value }: { value: number }) {
  return (
    <span className="inline-flex h-6 min-w-[36px] items-center justify-center rounded-full bg-primary-100 px-2 text-xs font-semibold text-brand-purple">
      {String(value).padStart(2, "0")}
    </span>
  );
}

function AttentionPill({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-sm text-ink-500">0 Ruches</span>;
  }
  return (
    <span className="inline-flex items-center rounded-md bg-brand-orange px-3 py-1 text-xs font-semibold text-white">
      {String(count).padStart(2, "0")} Ruches
    </span>
  );
}

function StatusPill({ status }: { status: FermeListItem["status"] }) {
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
