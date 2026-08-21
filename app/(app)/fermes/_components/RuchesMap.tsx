"use client";

import dynamic from "next/dynamic";
import { MapPin } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { MockRuche } from "./fermeMockData";

/**
 * Leaflet uses `window` at module evaluation, so the inner map has to be
 * loaded with `ssr: false`. This wrapper also renders a neutral empty state
 * when no ruche has coordinates.
 */
const RuchesMapInner = dynamic(() => import("./RuchesMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink-50 text-xs text-ink-400">
      Chargement de la carte…
    </div>
  ),
});

interface RuchesMapProps {
  ruches: MockRuche[];
  /** Fallback center (typically the parent ferme's lat/lng). */
  fallbackLat: number | null;
  fallbackLng: number | null;
  className?: string;
}

export function RuchesMap({
  ruches,
  fallbackLat,
  fallbackLng,
  className,
}: RuchesMapProps) {
  const positioned = ruches.filter(
    (r) => typeof r.lat === "number" && typeof r.lng === "number"
  );
  if (
    positioned.length === 0 &&
    (fallbackLat === null || fallbackLng === null)
  ) {
    return (
      <div
        className={cn(
          "flex aspect-[2/1] items-center justify-center rounded-2xl bg-ink-50 text-sm text-ink-500",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <MapPin className="h-6 w-6 text-ink-400" />
          <span>Aucune position enregistrée</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "isolate overflow-hidden rounded-2xl border border-ink-100 bg-ink-50",
        className
      )}
    >
      <RuchesMapInner
        ruches={ruches}
        fallbackLat={fallbackLat}
        fallbackLng={fallbackLng}
      />
    </div>
  );
}
