"use client";

import { ArrowUpDown, CheckCircle2, Pencil, Trash2 } from "@/lib/icons";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import { formatFR, formatTimeFR } from "@/lib/calendar";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type AlertType = "Batterie" | "Venin" | "Capteur";
export type AlertStatus = "resolue" | "non-resolue" | "en-cours";

export interface AlertRow {
  id: string;
  alert: string;
  type: AlertType;
  ferme: string;
  localisation: string;
  /** ISO timestamp — formatted to "JJ/MM/AAAA - HH:MM" in the cell. */
  occurredAt: string;
  status: AlertStatus;
}

interface ApiculteurAlertsCardProps {
  rows: AlertRow[];
  onSeeMore?: () => void;
  onEdit?: (row: AlertRow) => void;
  onDelete?: (row: AlertRow) => void;
  onResolve?: (row: AlertRow) => void;
}

/* -------------------------------------------------------------------------- */
/*                          Tone helpers                                      */
/* -------------------------------------------------------------------------- */

const TYPE_STYLES: Record<AlertType, string> = {
  Batterie: "bg-primary-100 text-brand-purple",
  Venin: "bg-brand-orange text-white",
  Capteur: "bg-accent-50 text-[#9B5A1F]",
};

const STATUS_CONFIG: Record<
  AlertStatus,
  { label: string; pill: string; dot: string }
> = {
  resolue: {
    label: "Résolue",
    pill: "bg-primary-100 text-brand-purple",
    dot: "bg-brand-purple",
  },
  "non-resolue": {
    label: "Non résolue",
    pill: "bg-ink-100 text-ink-600",
    dot: "bg-ink-500",
  },
  "en-cours": {
    label: "En cours",
    pill: "bg-accent-50 text-[#9B5A1F]",
    dot: "bg-brand-orange",
  },
};

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

/**
 * "Dernières alertes" card: a compact table of recent alerts followed by
 * a full-width "Voir plus" CTA. Matches the apiculteur dashboard mockup.
 */
export function ApiculteurAlertsCard({
  rows,
  onSeeMore,
  onEdit,
  onDelete,
  onResolve,
}: ApiculteurAlertsCardProps) {
  return (
    <section className="rounded-[18px] bg-white p-5 shadow-card md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">
          Dernières alertes
        </h2>
      </header>

      {/* Desktop / tablet table */}
      <div className="hidden md:block">
        <Table className="border-0 shadow-none">
          <TableHead>
            <Th>
              <span className="inline-flex items-center gap-1.5">
                ALERTE
                <ArrowUpDown className="h-3 w-3 text-ink-400" />
              </span>
            </Th>
            <Th>TYPE</Th>
            <Th>
              <span className="inline-flex items-center gap-1.5">
                FERME
                <ArrowUpDown className="h-3 w-3 text-ink-400" />
              </span>
            </Th>
            <Th>LOCALISATION</Th>
            <Th>
              <span className="inline-flex items-center gap-1.5">
                HEURE ET DATE
                <ArrowUpDown className="h-3 w-3 text-ink-400" />
              </span>
            </Th>
            <Th>STATUE</Th>
            <Th className="text-right">ACTIONS</Th>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <Td colSpan={7}>
                  <div className="py-10 text-center text-sm text-ink-500">
                    Aucune alerte récente.
                  </div>
                </Td>
              </TableRow>
            ) : (
              rows.map((row) => {
                const occurred = new Date(row.occurredAt);
                const status = STATUS_CONFIG[row.status];
                return (
                  <TableRow key={row.id}>
                    <Td className="font-medium text-ink-900">{row.alert}</Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold",
                          TYPE_STYLES[row.type]
                        )}
                      >
                        {row.type}
                      </span>
                    </Td>
                    <Td className="text-ink-700">{row.ferme}</Td>
                    <Td className="text-ink-700">{row.localisation}</Td>
                    <Td className="text-ink-700">
                      {formatFR(occurred)} - {formatTimeFR(occurred)}
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                          status.pill
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            status.dot
                          )}
                        />
                        {status.label}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        <IconAction
                          ariaLabel={`Modifier l'alerte ${row.alert}`}
                          onClick={() => onEdit?.(row)}
                          tone="purple"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction
                          ariaLabel={`Supprimer l'alerte ${row.alert}`}
                          onClick={() => onDelete?.(row)}
                          tone="orange"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction
                          ariaLabel={`Marquer comme résolue`}
                          onClick={() => onResolve?.(row)}
                          tone="purple-solid"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </IconAction>
                      </div>
                    </Td>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {rows.length === 0 && (
          <p className="rounded-2xl bg-ink-50 p-6 text-center text-sm text-ink-500">
            Aucune alerte récente.
          </p>
        )}
        {rows.map((row) => {
          const occurred = new Date(row.occurredAt);
          const status = STATUS_CONFIG[row.status];
          return (
            <article
              key={row.id}
              className="rounded-2xl bg-ink-50/50 p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">{row.alert}</p>
                  <p className="text-xs text-ink-500">{row.ferme}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                    TYPE_STYLES[row.type]
                  )}
                >
                  {row.type}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
                <span>
                  {formatFR(occurred)} · {formatTimeFR(occurred)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    status.pill
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                  {status.label}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onSeeMore}
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-pill bg-brand-purple text-sm font-semibold text-white transition-colors hover:bg-brand-purple-hover"
      >
        Voir plus
      </button>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              IconAction                                    */
/* -------------------------------------------------------------------------- */

function IconAction({
  children,
  ariaLabel,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  tone: "purple" | "orange" | "purple-solid";
}) {
  const styles: Record<typeof tone, string> = {
    purple:
      "bg-primary-100 text-brand-purple hover:bg-primary-200",
    orange:
      "bg-accent-50 text-brand-orange hover:bg-accent-100",
    "purple-solid":
      "bg-brand-purple text-white hover:bg-brand-purple-hover",
  };
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        styles[tone]
      )}
    >
      {children}
    </button>
  );
}
