"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L, { LatLngBounds, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MockRuche } from "./fermeMockData";

interface RuchesMapInnerProps {
  ruches: MockRuche[];
  fallbackLat: number | null;
  fallbackLng: number | null;
}

/**
 * Build a small teardrop SVG marker in the requested brand color.
 * Returns a Leaflet DivIcon so no external image assets are needed.
 */
function buildMarker(color: string) {
  return L.divIcon({
    className: "ruche-marker",
    html: `
      <span class="block">
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="rm-shadow-${color.replace("#", "")}" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.25" flood-opacity="0.25" />
            </filter>
          </defs>
          <path
            d="M14 1.5C7.1 1.5 1.5 7.1 1.5 14c0 9.1 11 19.9 11.5 20.4a1.6 1.6 0 0 0 2 0c.5-.5 11.5-11.3 11.5-20.4 0-6.9-5.6-12.5-12.5-12.5z"
            fill="${color}"
            stroke="#FFFFFF"
            stroke-width="2"
            filter="url(#rm-shadow-${color.replace("#", "")})"
          />
          <circle cx="14" cy="14" r="4.5" fill="#FFFFFF" />
        </svg>
      </span>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30],
  });
}

const ICON_ALERTE = buildMarker("#F08A1D");
const ICON_NORMALE = buildMarker("#5D4FEC");

/** Fits the Leaflet view to all positioned ruches whenever the list changes. */
function FitToRuches({ ruches }: { ruches: MockRuche[] }) {
  const map = useMap();
  useEffect(() => {
    const positioned = ruches.filter(
      (r) => typeof r.lat === "number" && typeof r.lng === "number"
    );
    if (positioned.length === 0) return;
    if (positioned.length === 1) {
      const r = positioned[0];
      map.setView([r.lat as number, r.lng as number], 16, { animate: true });
      return;
    }
    const bounds = new LatLngBounds(
      positioned.map((r) => [r.lat as number, r.lng as number]) as LatLngTuple[]
    );
    map.fitBounds(bounds.pad(0.4), { animate: true });
  }, [ruches, map]);
  return null;
}

export default function RuchesMapInner({
  ruches,
  fallbackLat,
  fallbackLng,
}: RuchesMapInnerProps) {
  const positioned = ruches.filter(
    (r) => typeof r.lat === "number" && typeof r.lng === "number"
  );
  const initial: LatLngTuple =
    positioned[0]
      ? [positioned[0].lat as number, positioned[0].lng as number]
      : fallbackLat != null && fallbackLng != null
      ? [fallbackLat, fallbackLng]
      : [34.0, 9.5];

  return (
    <MapContainer
      center={initial}
      zoom={15}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {positioned.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat as number, r.lng as number]}
          icon={r.status === "alerte" ? ICON_ALERTE : ICON_NORMALE}
        >
          <Popup>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-ink-900">{r.name}</p>
              <p className="text-xs text-ink-600">{r.localisation}</p>
              <p
                className="text-xs font-medium"
                style={{
                  color: r.status === "alerte" ? "#9B5A1F" : "#5D4FEC",
                }}
              >
                {r.status === "alerte"
                  ? `Alerte · ${r.alerts} active(s)`
                  : "Normale"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
      <FitToRuches ruches={ruches} />
    </MapContainer>
  );
}
