"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import type { OverviewPoint } from "./OverviewMapInner";

/**
 * Lazy-loaded real OpenStreetMap of Tunisia with one branded dot per
 * apiculteur, colored by subscription status. Used in the right column
 * of /apiculteurs ("Répartitions géographique").
 */
const OverviewMapInner = dynamic(() => import("./OverviewMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink-50 text-xs text-ink-400">
      Chargement de la carte…
    </div>
  ),
});

interface OverviewMapProps {
  points: OverviewPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export function OverviewMap({
  points,
  selectedId,
  onSelect,
  className,
}: OverviewMapProps) {
  return (
    <div
      // `isolate` creates a new stacking context so Leaflet's z-800 controls
      // (zoom buttons, attribution, popups) can never escape above modals /
      // drawers that sit at z-50.
      className={cn(
        "isolate overflow-hidden rounded-2xl border border-ink-100 bg-ink-50",
        className
      )}
    >
      <OverviewMapInner
        points={points}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}

/** Small legend dot + label, kept here so consumers don't need to know colors. */
export function OverviewMapLegend({
  variant,
  label,
}: {
  variant: OverviewPoint["status"];
  label: string;
}) {
  const color =
    variant === "active"
      ? "#5D4FEC"
      : variant === "expired"
      ? "#E89441"
      : "#E76E5C";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-700">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
