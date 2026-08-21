"use client";

import { cn } from "@/lib/cn";

export interface HBarRow {
  label: string;
  /** 0–100 inclusive (percentage). */
  value: number;
  /** CSS color for the filled portion. */
  color: string;
}

export type HBarSize = "sm" | "md" | "lg" | "xl";

interface HBarChartProps {
  data: HBarRow[];
  /** Show the value as % to the right of each bar. */
  showValue?: boolean;
  /**
   * Track height + surrounding row sizing.
   *   • `sm`  — 8px (compact, sidebars / mini-cards)
   *   • `md`  — 12px (default, dashboard charts)
   *   • `lg`  — 16px
   *   • `xl`  — 20px (hero / "look at me" charts)
   */
  size?: HBarSize;
  className?: string;
}

const TRACK_HEIGHT: Record<HBarSize, string> = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
  xl: "h-5",
};

const ROW_GAP: Record<HBarSize, string> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-5",
  xl: "gap-6",
};

/**
 * Stacked horizontal bar comparison (one bar per row).
 * Used in the dashboard for "Homme / Femme" repartition.
 */
export function HBarChart({
  data,
  showValue = true,
  size = "md",
  className,
}: HBarChartProps) {
  return (
    <div className={cn("flex flex-col", ROW_GAP[size], className)}>
      {data.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[56px_1fr_44px] items-center gap-3"
        >
          <span className="text-xs text-ink-600">{row.label}</span>
          <div
            className={cn(
              "w-full overflow-hidden rounded-full bg-ink-100",
              TRACK_HEIGHT[size]
            )}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, row.value))}%`,
                background: row.color,
              }}
            />
          </div>
          {showValue ? (
            <span className="text-right text-xs font-medium text-ink-600">
              {Math.round(row.value)}%
            </span>
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  );
}
