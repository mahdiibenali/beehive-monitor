"use client";

import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type MapMarkerTone = "normal" | "alert";

export interface MapMarker {
  id: string;
  /** Display name shown in tooltip / aria-label. */
  label: string;
  /** Latitude in degrees (real-world value — we project it ourselves). */
  lat: number;
  /** Longitude in degrees. */
  lng: number;
  tone: MapMarkerTone;
}

interface ApiculteurMapCardProps {
  /** Number above the legend, e.g. 32. */
  alertCount: number;
  markers: MapMarker[];
  /**
   * Geographic bounds rendered by the placeholder map. Defaults to a
   * northern-Tunisia frame matching the Figma mockup.
   */
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

const DEFAULT_BOUNDS = {
  minLat: 33.5,
  maxLat: 37.6,
  minLng: 7.5,
  maxLng: 11.7,
};

/**
 * "Répartitions géographique" card. Today this is a styled SVG
 * placeholder — the same component will be swapped to a real map
 * (Mapbox / Leaflet / Google Maps) when the integration is wired.
 *
 * The placeholder is intentionally lightweight so we don't ship a
 * heavy mapping library just to draw a static frame.
 */
export function ApiculteurMapCard({
  alertCount,
  markers,
  bounds = DEFAULT_BOUNDS,
}: ApiculteurMapCardProps) {
  return (
    <section className="flex flex-col rounded-[18px] bg-white p-5 shadow-card md:p-6">
      <header>
        <h2 className="text-sm font-semibold text-ink-900">
          Répartitions géographique
        </h2>
        <p className="text-xs text-ink-500">{alertCount} Alertes</p>
      </header>

      <div className="relative mt-3 flex-1 overflow-hidden rounded-2xl">
        <MapPlaceholder bounds={bounds} markers={markers} />
      </div>

      <footer className="mt-3 flex items-center gap-4 text-xs text-ink-600">
        <Legend tone="normal" label="Normale" />
        <Legend tone="alert" label="Alertes" />
      </footer>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Placeholder map                               */
/* -------------------------------------------------------------------------- */

function MapPlaceholder({
  bounds,
  markers,
}: {
  bounds: NonNullable<ApiculteurMapCardProps["bounds"]>;
  markers: MapMarker[];
}) {
  // SVG viewBox in 0..1 space so the map scales fluidly to its container.
  const W = 100;
  const H = 60;

  function project(m: MapMarker) {
    const lngRatio = (m.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
    const latRatio = (m.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
    return {
      x: lngRatio * W,
      // SVG y grows downward; flip the lat ratio so north is up.
      y: (1 - latRatio) * H,
    };
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="h-[240px] w-full bg-gradient-to-br from-[#E6F0FB] to-[#F5F7FE]"
      role="img"
      aria-label="Carte des alertes"
    >
      {/* Stylised "sea" / "land" shapes — purely decorative, not GIS-accurate. */}
      <defs>
        <linearGradient id="seaGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#CBE2FA" />
          <stop offset="100%" stopColor="#E1ECFC" />
        </linearGradient>
        <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0EAD6" />
          <stop offset="100%" stopColor="#E4DFC9" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={W} height={H} fill="url(#seaGrad)" />
      <path
        d="M 0,20 C 12,18 20,28 26,25 C 32,22 38,30 46,29 C 54,28 62,34 70,33 C 78,32 86,28 100,30 L 100,60 L 0,60 Z"
        fill="url(#landGrad)"
        opacity={0.85}
      />
      <path
        d="M 60,5 C 66,7 72,10 78,8 L 80,14 C 74,16 66,14 60,12 Z"
        fill="url(#landGrad)"
        opacity={0.7}
      />

      {/* Markers */}
      {markers.map((m) => {
        const { x, y } = project(m);
        const isAlert = m.tone === "alert";
        const color = isAlert ? "#E89441" : "#5D4FEC";
        return (
          <g key={m.id}>
            {isAlert && (
              <circle cx={x} cy={y} r={2.2} fill={color} opacity={0.18} />
            )}
            <circle
              cx={x}
              cy={y}
              r={1.1}
              fill={color}
              stroke="#fff"
              strokeWidth={0.4}
            >
              <title>{m.label}</title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Legend                                        */
/* -------------------------------------------------------------------------- */

function Legend({
  tone,
  label,
}: {
  tone: MapMarkerTone;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          tone === "alert" ? "bg-brand-orange" : "bg-brand-purple"
        )}
      />
      {label}
    </span>
  );
}
