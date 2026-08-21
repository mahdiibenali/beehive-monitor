"use client";

import dynamic from "next/dynamic";
import { MapPin } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { FermeItem } from "@/lib/apiculteurs/serializer";

/**
 * Leaflet uses `window` at module evaluation time, so the inner map component
 * has to be lazy-loaded with `ssr: false`. This wrapper handles that plus a
 * neutral empty state when no ferme has coordinates.
 */
const FermesMapInner = dynamic(() => import("./FermesMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink-50 text-xs text-ink-400">
      Chargement de la carte…
    </div>
  ),
});

interface FermesMapProps {
  fermes: FermeItem[];
  /** Fallback center if no ferme has coordinates (typically the apiculteur). */
  fallbackLat: number | null;
  fallbackLng: number | null;
  className?: string;
}

export function FermesMap({
  fermes,
  fallbackLat,
  fallbackLng,
  className,
}: FermesMapProps) {
  const positioned = fermes.filter(
    (f) => typeof f.lat === "number" && typeof f.lng === "number"
  );

  if (positioned.length === 0 && (fallbackLat === null || fallbackLng === null)) {
    return (
      <div
        className={cn(
          "flex aspect-[2/1] items-center justify-center rounded-2xl bg-ink-50 text-sm text-ink-500",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <MapPin className="h-6 w-6 text-ink-400" />
          <span>Aucune localisation enregistrée</span>
        </div>
      </div>
    );
  }

  return (
    <div
      // `isolate` keeps Leaflet's z-800 controls inside their own stacking
      // context so they can't bleed above modals / dropdowns layered above.
      className={cn(
        "isolate overflow-hidden rounded-2xl border border-ink-100 bg-ink-50",
        className
      )}
    >
      <FermesMapInner
        fermes={fermes}
        fallbackLat={fallbackLat}
        fallbackLng={fallbackLng}
      />
    </div>
  );
}
