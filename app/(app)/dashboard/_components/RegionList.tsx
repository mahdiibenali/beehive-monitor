"use client";

import { cn } from "@/lib/cn";

/**
 * Flat, scrollable list of regions for the super-admin dashboard.
 *
 * Designed to live inside a flex-column card: the list takes whatever
 * vertical space the parent gives it (`flex-1 min-h-0`) and scrolls
 * internally with a slim brand-matching scrollbar — no fixed height
 * means the card never leaves a big blank stripe under the data.
 */
export interface RegionRow {
  name: string;
  /** Raw apiculteur count for the region — bar scales against `max`. */
  value: number;
}

interface RegionListProps {
  data: RegionRow[];
  /** Optional override for the bar normalization (defaults to the max row). */
  max?: number;
  className?: string;
}

export function RegionList({ data, max, className }: RegionListProps) {
  const computedMax = max ?? Math.max(...data.map((r) => r.value), 1);

  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink-500">
        Aucune donnée régionale.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1",
        // Slim, brand-tinted scrollbar (WebKit + Firefox).
        "[scrollbar-width:thin] [scrollbar-color:theme(colors.ink.200)_transparent]",
        "[&::-webkit-scrollbar]:w-1.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb]:bg-ink-200",
        "hover:[&::-webkit-scrollbar-thumb]:bg-ink-300",
        className
      )}
    >
      <ul className="flex flex-col">
        {data.map((region, idx) => {
          const pct = (region.value / computedMax) * 100;
          return (
            <li
              key={region.name}
              className="grid grid-cols-[28px_1fr_minmax(120px,180px)_44px] items-center gap-3 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-primary-50/40"
            >
              <span className="text-[11px] font-semibold tabular-nums text-ink-400">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="truncate text-sm font-medium text-ink-900">
                {region.name}
              </span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-hover transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-right text-xs font-semibold tabular-nums text-ink-700">
                {region.value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
