"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2 } from "lucide-react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Checkbox } from "@/components/ui/Checkbox";

export type MaintenanceStatus = "traite" | "non-traite";

export interface MaintenanceRow {
  id: string;
  name: string;
  email: string;
  initials: string;
  /** Pre-formatted date string (e.g. "09/06/2026"). */
  dateRange: string;
  title: string;
  status: MaintenanceStatus;
  /** Optional avatar — falls back to initials. */
  avatarSrc?: string;
}

interface MaintenanceCardProps {
  rows: MaintenanceRow[];
  /**
   * Optional override for the "Voir plus" button. When omitted, defaults to
   * navigating to `/maintenance`.
   */
  onShowMore?: () => void;
  /**
   * Optional override for the row-level expand button. When omitted, defaults
   * to navigating to `/maintenance?open=<id>`, which the maintenance page
   * picks up to open the detail drawer.
   */
  onRowOpen?: (row: MaintenanceRow) => void;
  /** Friendly state shown in place of the table when nothing to display. */
  emptyState?: string;
}

/** "Dernière demande de maintenance" card + "Voir plus" footer button. */
export function MaintenanceCard({
  rows,
  onShowMore,
  onRowOpen,
  emptyState,
}: MaintenanceCardProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allSelected = rows.length > 0 && rows.every((r) => selected[r.id]);

  const handleShowMore = () => {
    if (onShowMore) onShowMore();
    else router.push("/maintenance");
  };

  const handleRowOpen = (row: MaintenanceRow) => {
    if (onRowOpen) onRowOpen(row);
    else router.push(`/maintenance?open=${encodeURIComponent(row.id)}`);
  };

  const toggleAll = () =>
    setSelected(
      allSelected
        ? {}
        : Object.fromEntries(rows.map((r) => [r.id, true]))
    );

  const toggle = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  return (
    <section className="overflow-hidden rounded-[18px] bg-white shadow-card">
      <div className="p-5 pb-3">
        <h2 className="text-sm font-semibold text-ink-900">
          Dernière demande de maintenance
        </h2>
      </div>

      <Table className="rounded-none border-none shadow-none">
        <TableHead>
          <Th className="w-12">
            <Checkbox
              checked={allSelected}
              onChange={toggleAll}
              label=""
            />
          </Th>
          <Th sortable className="w-[35%]">
            Nom complet et e-mail
          </Th>
          <Th sortable className="w-[25%]">
            Date
          </Th>
          <Th className="w-[20%]">Titres</Th>
          <Th className="w-[20%]">Statut</Th>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <Td className="text-center text-sm text-ink-500" colSpan={5}>
                {emptyState ?? "Aucune demande pour le moment."}
              </Td>
            </TableRow>
          )}
          {rows.map((r) => (
            <TableRow key={r.id} selected={!!selected[r.id]}>
              <Td>
                <Checkbox
                  checked={!!selected[r.id]}
                  onChange={() => toggle(r.id)}
                  label=""
                />
              </Td>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar
                    initials={r.initials}
                    src={r.avatarSrc || undefined}
                    alt={r.name}
                    size="sm"
                  />
                  <div>
                    <div className="text-sm font-semibold text-ink-900">
                      {r.name}
                    </div>
                    <div className="text-xs text-ink-500">{r.email}</div>
                  </div>
                </div>
              </Td>
              <Td className="text-ink-600">{r.dateRange}</Td>
              <Td className="text-ink-800">{r.title}</Td>
              <Td>
                <div className="flex items-center justify-between">
                  {r.status === "traite" ? (
                    <StatusBadge variant="active">Traité</StatusBadge>
                  ) : (
                    <StatusBadge variant="disabled">Non traité</StatusBadge>
                  )}
                  <button
                    type="button"
                    aria-label="Voir le détail"
                    onClick={() => handleRowOpen(r)}
                    className="text-ink-400 transition-colors hover:text-brand-purple"
                  >
                    <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </Td>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="p-4">
        <button
          type="button"
          onClick={handleShowMore}
          className="flex h-11 w-full items-center justify-center rounded-full bg-brand-purple text-sm font-medium text-white transition-colors hover:bg-brand-purple-hover active:bg-brand-purple-pressed"
        >
          Voir plus
        </button>
      </div>
    </section>
  );
}
