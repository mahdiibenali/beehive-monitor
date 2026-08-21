"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SelectPill } from "@/components/ui/SelectPill";
import { Pagination } from "@/components/ui/Pagination";
import { DatePicker, type DateFilterType } from "@/components/ui/DatePicker";
import { Avatar } from "@/components/ui/Avatar";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Search,
  XCircle,
} from "@/lib/icons";
import { formatFR, formatTimeFR } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { describeAction, describeEntity } from "@/lib/audit/labels";
import {
  formatChangeValue,
  formatFieldName,
  looksTechnical,
} from "@/lib/audit/format";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

interface AuditLogItem {
  id: string;
  actor: {
    id: string | null;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  status: "success" | "failure";
  changes: { field: string; before: unknown; after: unknown }[];
  metadata: Record<string, unknown>;
  ip: string;
  userAgent: string;
  createdAt: string;
}

interface AuditLogListPayload {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  facets: { entities: string[]; actions: string[] };
  statusCounts: { success: number; failure: number };
}

type StatusFilter = "all" | "success" | "failure";
type Tab = "activity" | "connections";

const PAGE_SIZE = 25;

const TAB_OPTIONS = [
  { value: "activity", label: "Activité", tone: "purple" as const },
  { value: "connections", label: "Connexions", tone: "purple" as const },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Tous", tone: "purple" as const },
  { value: "success", label: "Succès", tone: "yellow" as const },
  { value: "failure", label: "Échec", tone: "red" as const },
];

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function initialsOf(name: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${formatFR(d)} · ${formatTimeFR(d)}`;
}

/* -------------------------------------------------------------------------- */
/*                              AuditLogsClient                               */
/* -------------------------------------------------------------------------- */

export function AuditLogsClient() {
  const [data, setData] = useState<AuditLogListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("activity");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [entity, setEntity] = useState<string>("");
  const [action, setAction] = useState<string>("");

  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("est");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);

  const [dateOpen, setDateOpen] = useState(false);

  const [page, setPage] = useState(1);

  // Debounce the free-text search to avoid spamming the API on each keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  // Whenever a filter changes, reset the page back to 1.
  useEffect(() => {
    setPage(1);
  }, [
    tab,
    debouncedSearch,
    status,
    entity,
    action,
    dateFilterType,
    filterDate,
    rangeStart,
    rangeEnd,
  ]);

  // Switching tabs clears entity/action selections that don't apply to the
  // new tab (e.g. action="apiculteur.create" makes no sense under "Connexions").
  // We also reset the status filter back to "all" since it is only exposed
  // under Connexions — a stale "failure" filter on Activité would silently
  // hide every row.
  useEffect(() => {
    setEntity("");
    setAction("");
    setStatus("all");
  }, [tab]);

  // -------------------------------------------------------------------------
  // Fetch — translate the active filters into URL params, sort always desc by
  // createdAt (handled server-side). Cancel-safe on unmount.
  // -------------------------------------------------------------------------
  const fetchLogs = useCallback(
    async (signal: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (status !== "all") params.set("status", status);
        // Tab → entity scope: "connections" pins entity to `auth`, "activity"
        // hides every auth event from the table.
        if (tab === "connections") {
          params.set("entity", "auth");
        } else if (entity) {
          params.set("entity", entity);
        } else {
          params.set("notEntity", "auth");
        }
        if (action) params.set("action", action);

        // Date filter translation:
        //   • est       → from = day-start, to = day-end
        //   • avant     → to = day-end
        //   • apres     → from = day-start
        //   • est-entre → from = start, to = end
        if (dateFilterType === "est" && filterDate) {
          const start = new Date(filterDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(filterDate);
          end.setHours(23, 59, 59, 999);
          params.set("from", start.toISOString());
          params.set("to", end.toISOString());
        } else if (dateFilterType === "avant" && filterDate) {
          const end = new Date(filterDate);
          end.setHours(23, 59, 59, 999);
          params.set("to", end.toISOString());
        } else if (dateFilterType === "apres" && filterDate) {
          const start = new Date(filterDate);
          start.setHours(0, 0, 0, 0);
          params.set("from", start.toISOString());
        } else if (dateFilterType === "est-entre") {
          if (rangeStart) {
            const start = new Date(rangeStart);
            start.setHours(0, 0, 0, 0);
            params.set("from", start.toISOString());
          }
          if (rangeEnd) {
            const end = new Date(rangeEnd);
            end.setHours(23, 59, 59, 999);
            params.set("to", end.toISOString());
          }
        }

        const res = await fetch(`/api/audit-logs?${params.toString()}`, {
          cache: "no-store",
          signal,
        });
        if (!res.ok) {
          setError("Impossible de charger le journal d'audit.");
          return;
        }
        const payload = (await res.json()) as AuditLogListPayload;
        if (!signal.aborted) setData(payload);
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") {
          setError("Impossible de charger le journal d'audit.");
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [
      page,
      tab,
      debouncedSearch,
      status,
      entity,
      action,
      dateFilterType,
      filterDate,
      rangeStart,
      rangeEnd,
    ]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchLogs(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchLogs]);

  // -------------------------------------------------------------------------
  // Derived view-models for the dropdowns + stats row.
  // -------------------------------------------------------------------------
  // Entity dropdown: only the non-auth entities (auth is its own tab now).
  const entityOptions = useMemo(
    () => [
      { value: "", label: "Toutes les entités" },
      ...(data?.facets.entities ?? [])
        .filter((e) => e !== "auth")
        .map((e) => ({
          value: e,
          label: describeEntity(e),
        })),
    ],
    [data]
  );

  // Action dropdown: tab-scoped — in "Connexions" we only show `auth.*`
  // actions, in "Activité" we hide them.
  const actionOptions = useMemo(() => {
    const all = data?.facets.actions ?? [];
    const filtered =
      tab === "connections"
        ? all.filter((a) => a.startsWith("auth."))
        : all.filter((a) => !a.startsWith("auth."));
    return [
      { value: "", label: "Toutes les actions" },
      ...filtered.map((a) => ({
        value: a,
        label: describeAction(a),
      })),
    ];
  }, [data, tab]);

  const total = data?.total ?? 0;
  const startIdx = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, total);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Trigger button label reflects the active selection.
  const dateTriggerLabel = useMemo(() => {
    if (dateFilterType === "est-entre" && rangeStart && rangeEnd) {
      return `${formatFR(rangeStart)} → ${formatFR(rangeEnd)}`;
    }
    if (filterDate) {
      const prefix =
        dateFilterType === "avant"
          ? "Avant"
          : dateFilterType === "apres"
            ? "Après"
            : "Le";
      return `${prefix} ${formatFR(filterDate)}`;
    }
    return "Date";
  }, [dateFilterType, filterDate, rangeStart, rangeEnd]);

  const hasDateFilter =
    filterDate !== null || rangeStart !== null || rangeEnd !== null;

  function clearDateFilter() {
    setFilterDate(null);
    setRangeStart(null);
    setRangeEnd(null);
    setDateOpen(false);
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setEntity("");
    setAction("");
    setDateFilterType("est");
    setFilterDate(null);
    setRangeStart(null);
    setRangeEnd(null);
  }

  const hasAnyFilter =
    debouncedSearch.length > 0 ||
    status !== "all" ||
    entity !== "" ||
    action !== "" ||
    filterDate !== null ||
    rangeStart !== null ||
    rangeEnd !== null;

  return (
    <div>
      <PageHeader
        title="Journal d'audit"
        subtitle={
          tab === "connections"
            ? "Historique des connexions et déconnexions."
            : "Historique des actions effectuées sur la plateforme."
        }
      />

      {/* Tabs — split business activity from auth/connection events */}
      <div className="mb-4">
        <SelectPill
          variant="segmented"
          options={TAB_OPTIONS}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
        />
      </div>

      {/* Filters */}
      <section className="mb-4 rounded-[18px] bg-white p-4 shadow-card">
        <div
          className={cn(
            "grid gap-3",
            tab === "connections"
              ? "lg:grid-cols-[1fr_minmax(220px,260px)_auto]"
              : "lg:grid-cols-[1fr_minmax(220px,260px)_minmax(220px,260px)_auto]"
          )}
        >
          <Input
            placeholder={
              tab === "connections"
                ? "Rechercher un utilisateur, une IP…"
                : "Rechercher un acteur, une entité, un résumé…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search />}
          />
          {tab === "activity" && (
            <Select
              placeholder="Toutes les entités"
              options={entityOptions}
              value={entity || undefined}
              onChange={(v) => setEntity(v)}
            />
          )}
          <Select
            placeholder="Toutes les actions"
            options={actionOptions}
            value={action || undefined}
            onChange={(v) => setAction(v)}
          />
          <DateFilterPopover
            label={dateTriggerLabel}
            active={hasDateFilter}
            open={dateOpen}
            onOpenChange={setDateOpen}
            filterType={dateFilterType}
            onChangeFilterType={setDateFilterType}
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

        {(tab === "connections" || hasAnyFilter) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {tab === "connections" ? (
              <SelectPill
                variant="segmented"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => setStatus(v as StatusFilter)}
              />
            ) : (
              <span />
            )}
            {hasAnyFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-brand-purple hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </section>

      {/* Table */}
      <section className="rounded-[18px] bg-white shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <Th className="w-[28%]">
                {tab === "connections" ? "Utilisateur" : "Acteur"}
              </Th>
              <Th className="w-[22%]">Action</Th>
              <Th className="w-[14%]">
                {tab === "connections" ? "IP" : "Entité"}
              </Th>
              <Th className="w-[12%]">Statut</Th>
              <Th className="w-[18%]">Date</Th>
              <Th className="w-[6%]" />
            </TableHead>
            <TableBody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-ink-500"
                  >
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-brand-orange"
                  >
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && data?.items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-ink-500"
                  >
                    Aucune entrée ne correspond aux filtres.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                (data?.items ?? []).map((it) => {
                  const isOpen = expandedId === it.id;
                  return (
                    <LogRow
                      key={it.id}
                      item={it}
                      tab={tab}
                      isOpen={isOpen}
                      onToggle={() =>
                        setExpandedId((c) => (c === it.id ? null : it.id))
                      }
                    />
                  );
                })}
            </TableBody>
            {data && total > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={6} className="p-0">
                    <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
                      <span className="text-sm text-ink-500">
                        {startIdx}-{endIdx} sur {total}
                      </span>
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                      />
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </Table>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  LogRow                                    */
/* -------------------------------------------------------------------------- */

function LogRow({
  item,
  tab,
  isOpen,
  onToggle,
}: {
  item: AuditLogItem;
  tab: Tab;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow
        onClick={onToggle}
        className="cursor-pointer hover:bg-ink-50/60"
      >
        <Td>
          <div className="flex items-center gap-3">
            <Avatar initials={initialsOf(item.actor.name)} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink-900">
                {item.actor.name || item.actor.email || "—"}
              </div>
              <div className="truncate text-xs text-ink-500">
                {item.actor.email || item.actor.role || "—"}
              </div>
            </div>
          </div>
        </Td>
        <Td>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-ink-800">
              {describeAction(item.action)}
            </span>
            {item.summary && (
              <span className="line-clamp-1 text-xs text-ink-500">
                {item.summary}
              </span>
            )}
          </div>
        </Td>
        <Td>
          {tab === "connections" ? (
            <span className="font-mono text-xs text-ink-700">
              {item.ip || "—"}
            </span>
          ) : (
            <EntityChip entity={item.entity} entityId={item.entityId} />
          )}
        </Td>
        <Td>
          <StatusChip status={item.status} />
        </Td>
        <Td className="whitespace-nowrap text-sm text-ink-700">
          {formatDate(item.createdAt)}
        </Td>
        <Td onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? "Masquer le détail" : "Voir le détail"}
            aria-expanded={isOpen}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-ink-500 transition-colors hover:bg-primary-100 hover:text-brand-purple"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                isOpen && "rotate-180"
              )}
              strokeWidth={2.5}
            />
          </button>
        </Td>
      </TableRow>

      {isOpen && (
        <tr className="bg-ink-50/40">
          <td colSpan={6} className="px-4 py-4">
            <LogDetails item={item} />
          </td>
        </tr>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                LogDetails                                  */
/* -------------------------------------------------------------------------- */

function LogDetails({ item }: { item: AuditLogItem }) {
  const hasChanges = item.changes.length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Modifications */}
      <div className="rounded-[14px] border border-ink-100 bg-white p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
          Modifications
        </h3>
        {hasChanges ? (
          <ul className="flex flex-col gap-3">
            {item.changes.map((c, i) => (
              <ChangeRow
                key={`${c.field}-${i}`}
                field={c.field}
                before={c.before}
                after={c.after}
              />
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-500">Aucun champ modifié.</p>
        )}
      </div>

      {/* Connection / network info */}
      <div className="rounded-[14px] border border-ink-100 bg-white p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
          Connexion
        </h3>
        <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt className="font-semibold text-ink-700">Adresse IP</dt>
          <dd className="truncate font-mono text-ink-600">{item.ip || "—"}</dd>
          <dt className="font-semibold text-ink-700">Navigateur</dt>
          <dd className="line-clamp-2 text-ink-600">
            {summarizeUserAgent(item.userAgent)}
          </dd>
          {item.entityId && (
            <>
              <dt className="font-semibold text-ink-700">Référence</dt>
              <dd className="truncate font-mono text-ink-600">
                {item.entityId}
              </dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  ChangeRow                                 */
/* -------------------------------------------------------------------------- */

/**
 * Renders a single `{ field, before, after }` diff as a compact card:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │ Genre                                       │
 *   │ ┌──────────┐   ➜   ┌──────────┐             │
 *   │ │  Avant   │       │  Après   │             │
 *   │ │  Homme   │       │  Femme   │             │
 *   │ └──────────┘       └──────────┘             │
 *   └─────────────────────────────────────────────┘
 *
 * For long values (multi-line JSON, addresses…) the pills stack vertically.
 */
function ChangeRow({
  field,
  before,
  after,
}: {
  field: string;
  before: unknown;
  after: unknown;
}) {
  const beforeText = formatChangeValue(field, before);
  const afterText = formatChangeValue(field, after);
  const fieldLabel = formatFieldName(field);

  // Stack the two pills when either side is very long.
  const isLong =
    beforeText.length > 40 ||
    afterText.length > 40 ||
    beforeText.includes("\n") ||
    afterText.includes("\n");

  return (
    <li className="rounded-[10px] border border-ink-100 bg-ink-50/40 p-2.5">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        {fieldLabel}
      </p>
      <div
        className={cn(
          "flex gap-2",
          isLong ? "flex-col" : "flex-row items-stretch"
        )}
      >
        <ChangePill
          tone="before"
          label="Avant"
          value={beforeText}
          field={field}
        />
        <div
          className={cn(
            "flex items-center justify-center text-ink-400",
            isLong && "rotate-90"
          )}
          aria-hidden
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
        <ChangePill
          tone="after"
          label="Après"
          value={afterText}
          field={field}
        />
      </div>
    </li>
  );
}

function ChangePill({
  tone,
  label,
  value,
  field,
}: {
  tone: "before" | "after";
  label: string;
  value: string;
  field: string;
}) {
  const muted = value === "—" || value === "(vide)";
  const technical = typeof value === "string" && looksTechnical(value);
  const multiline = value.includes("\n");

  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-[8px] border px-2.5 py-1.5",
        tone === "before"
          ? "border-red-100 bg-red-50/50"
          : "border-success/20 bg-success/5"
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider",
          tone === "before" ? "text-red-500" : "text-success"
        )}
      >
        {label}
      </p>
      {multiline ? (
        <pre
          className={cn(
            "mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px]",
            muted ? "text-ink-400 italic" : "text-ink-800"
          )}
        >
          {value}
        </pre>
      ) : (
        <p
          className={cn(
            "mt-0.5 break-words text-xs",
            technical && "font-mono",
            muted ? "text-ink-400 italic" : "text-ink-800",
            tone === "after" && !muted && "font-semibold"
          )}
          title={field}
        >
          {value}
        </p>
      )}
    </div>
  );
}

/** Compress a raw User-Agent string into something like
 *  "Chrome · Windows" so non-technical users don't see the full UA blob. */
function summarizeUserAgent(ua: string): string {
  if (!ua) return "—";

  // Detect the major browser.
  let browser = "Inconnu";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua) || /Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  // Detect the OS family.
  let os = "Inconnu";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return `${browser} · ${os}`;
}

/* -------------------------------------------------------------------------- */
/*                              Small primitives                              */
/* -------------------------------------------------------------------------- */

function StatusChip({ status }: { status: "success" | "failure" }) {
  if (status === "failure") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Échec
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Succès
    </span>
  );
}

function EntityChip({
  entity,
  entityId,
}: {
  entity: string;
  entityId: string | null;
}) {
  if (!entity) {
    return <span className="text-xs text-ink-400">—</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex w-fit items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-brand-purple">
        {describeEntity(entity)}
      </span>
      {entityId && (
        <span className="truncate font-mono text-[10px] text-ink-400">
          {entityId.length > 14 ? `${entityId.slice(0, 8)}…` : entityId}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           DateFilterPopover                                */
/* -------------------------------------------------------------------------- */

interface DateFilterPopoverProps {
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
}

function DateFilterPopover({
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
}: DateFilterPopoverProps) {
  const isRange = filterType === "est-entre";
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-pill border border-ink-200 bg-white px-4 text-sm font-medium transition-colors hover:border-ink-300 lg:w-auto",
          active ? "text-ink-800" : "text-ink-400"
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-ink-500" />
        <span className="max-w-[200px] truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-ink-500 transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2.5}
        />
      </button>
      {open && (
        <>
          {/* Click-outside backdrop */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            className={cn(
              "absolute right-0 top-full z-40 mt-2",
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
