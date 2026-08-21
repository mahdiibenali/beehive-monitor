"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Check, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  AlertStatus,
  AlertType,
  MockAlert,
} from "./rucheMockData";

interface AlertsTableProps {
  alerts: MockAlert[];
  /** When provided, only alerts matching this type are shown. */
  filterType?: AlertType;
  /** Max rows before "Voir plus" appears. Defaults to 6. */
  initialRows?: number;
  /** Show the type column. Always true on the "Alertes" tab. */
  showTypeColumn?: boolean;
}

export function AlertsTable({
  alerts,
  filterType,
  initialRows = 6,
  showTypeColumn = true,
}: AlertsTableProps) {
  const [sortBy, setSortBy] = useState<"label" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(
    () => (filterType ? alerts.filter((a) => a.type === filterType) : alerts),
    [alerts, filterType]
  );

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortBy === "label") return a.label.localeCompare(b.label) * dir;
      return (
        (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir
      );
    });
  }, [filtered, sortBy, sortDir]);

  const visible = expanded ? sorted : sorted.slice(0, initialRows);
  const showVoirPlus = sorted.length > initialRows;

  function toggleSort(next: "label" | "date") {
    if (sortBy === next) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(next);
      setSortDir("desc");
    }
  }

  return (
    <section className="rounded-2xl border border-ink-100 bg-white">
      <div className="overflow-hidden rounded-2xl">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-white">
              <SortHeader
                active={sortBy === "label"}
                onClick={() => toggleSort("label")}
              >
                ALERTE
              </SortHeader>
              {showTypeColumn && <PlainHeader>TYPE</PlainHeader>}
              <SortHeader
                active={sortBy === "date"}
                onClick={() => toggleSort("date")}
              >
                DATE
              </SortHeader>
              <PlainHeader>STATUE</PlainHeader>
              <PlainHeader>ACTIONS</PlainHeader>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={showTypeColumn ? 5 : 4}
                  className="py-6 text-center text-sm text-ink-500"
                >
                  Aucune alerte enregistrée.
                </td>
              </tr>
            ) : (
              visible.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-ink-900">
                    {a.label}
                  </td>
                  {showTypeColumn && (
                    <td className="px-3 py-2.5">
                      <TypeBadge type={a.type} />
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm text-ink-700">
                    {formatDate(a.date)}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <RowActions />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showVoirPlus && (
        <div className="border-t border-ink-100 p-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-center rounded-pill bg-primary-100 px-4 py-2.5 text-sm font-medium text-brand-purple transition-colors hover:bg-primary-200"
          >
            {expanded ? "Voir moins" : "Voir plus"}
          </button>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                */
/* -------------------------------------------------------------------------- */

function PlainHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
      {children}
    </th>
  );
}

function SortHeader({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5">
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

function TypeBadge({ type }: { type: AlertType }) {
  const map: Record<AlertType, { label: string; bg: string; fg: string }> = {
    batterie: { label: "Batterie", bg: "bg-primary-100", fg: "text-brand-purple" },
    capteur: { label: "Capteur", bg: "bg-brand-orange", fg: "text-white" },
    venin: { label: "Venin", bg: "bg-primary-100", fg: "text-brand-purple" },
    gateway: { label: "Gateway", bg: "bg-primary-100", fg: "text-brand-purple" },
  };
  const cfg = map[type];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold",
        cfg.bg,
        cfg.fg
      )}
    >
      {cfg.label}
    </span>
  );
}

function StatusPill({ status }: { status: AlertStatus }) {
  if (status === "resolue") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-brand-purple">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />
        Résolue
      </span>
    );
  }
  if (status === "en-cours") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-[#9B5A1F]">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
        En cours
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
      Non résolue
    </span>
  );
}

function RowActions() {
  return (
    <div className="flex items-center gap-1">
      <ActionButton aria-label="Modifier" variant="purple">
        <Pencil className="h-3.5 w-3.5" />
      </ActionButton>
      <ActionButton aria-label="Supprimer" variant="orange">
        <Trash2 className="h-3.5 w-3.5" />
      </ActionButton>
      <ActionButton aria-label="Marquer comme résolue" variant="purple">
        <Check className="h-3.5 w-3.5" />
      </ActionButton>
    </div>
  );
}

function ActionButton({
  children,
  variant,
  ...rest
}: {
  children: React.ReactNode;
  variant: "purple" | "orange";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls =
    variant === "orange"
      ? "bg-accent-50 text-brand-orange hover:bg-accent-100"
      : "bg-primary-50 text-brand-purple hover:bg-primary-100";
  return (
    <button
      type="button"
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        cls
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} - ${hh}:${mi}`;
}
