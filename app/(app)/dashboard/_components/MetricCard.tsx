import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface MetricCardProps {
  /** Small label above the value, e.g. "Apiculteur". */
  label: string;
  /** Big number (renders as text). */
  value: ReactNode;
  /** Sub-text under the value, usually a delta like "+14 ce mois". */
  delta?: string;
  /** Lucide icon for the top-right square. */
  icon: ReactNode;
  className?: string;
}

/**
 * Full-width metric card used in the dashboard top row.
 * Visually:
 *   ┌────────────────────────────────┐
 *   │ Apiculteur            ┌──┐     │
 *   │                       │🐝│     │
 *   │ 300                   └──┘     │
 *   │ +14 ce mois                    │
 *   └────────────────────────────────┘
 */
export function MetricCard({
  label,
  value,
  delta,
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-[18px] bg-white p-5 shadow-card",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-ink-500">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-50 text-brand-purple">
          {icon}
        </span>
      </div>
      <span className="mt-1 text-[36px] font-semibold leading-tight text-ink-900">
        {value}
      </span>
      {delta && (
        <span className="text-sm font-medium text-brand-orange">{delta}</span>
      )}
    </div>
  );
}
