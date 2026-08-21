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
import type { FermeItem } from "@/lib/apiculteurs/serializer";

interface FermesMapInnerProps {
  fermes: FermeItem[];
  /** Fallback center when no ferme has coordinates. */
  fallbackLat: number | null;
  fallbackLng: number | null;
}

/**
 * Branded teardrop marker — purple body, white pin, brand colors.
 * Implemented as a Leaflet DivIcon so it ships zero external image assets.
 */
const fermeIcon = L.divIcon({
  className: "ferme-marker",
  html: `
    <span class="block">
      <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="ferme-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity="0.25" />
          </filter>
        </defs>
        <path
          d="M17 1.5c-8.56 0-15.5 6.94-15.5 15.5 0 11.07 13.46 24 14.04 24.55a2 2 0 0 0 2.92 0C19.04 41 32.5 28.07 32.5 17c0-8.56-6.94-15.5-15.5-15.5z"
          fill="#5D4FEC"
          stroke="#FFFFFF"
          stroke-width="2.5"
          filter="url(#ferme-shadow)"
        />
        <circle cx="17" cy="17" r="5.5" fill="#FFFFFF" />
      </svg>
    </span>
  `,
  iconSize: [34, 44],
  iconAnchor: [17, 42],
  popupAnchor: [0, -38],
});

/**
 * Fits the Leaflet view to all the fermes (or zooms into the single one)
 * any time the fermes list changes.
 */
function FitToFermes({ fermes }: { fermes: FermeItem[] }) {
  const map = useMap();

  useEffect(() => {
    const positioned = fermes.filter(
      (f) => typeof f.lat === "number" && typeof f.lng === "number"
    );
    if (positioned.length === 0) return;

    if (positioned.length === 1) {
      const f = positioned[0];
      map.setView([f.lat as number, f.lng as number], 15, { animate: true });
      return;
    }

    const bounds = new LatLngBounds(
      positioned.map((f) => [f.lat as number, f.lng as number]) as LatLngTuple[]
    );
    map.fitBounds(bounds.pad(0.25), { animate: true });
  }, [fermes, map]);

  return null;
}

export default function FermesMapInner({
  fermes,
  fallbackLat,
  fallbackLng,
}: FermesMapInnerProps) {
  const positioned = fermes.filter(
    (f) => typeof f.lat === "number" && typeof f.lng === "number"
  );
  // Pick something sensible as the *initial* center; FitToFermes will adjust.
  const initial: LatLngTuple =
    positioned[0] && typeof positioned[0].lat === "number"
      ? [positioned[0].lat as number, positioned[0].lng as number]
      : fallbackLat != null && fallbackLng != null
      ? [fallbackLat, fallbackLng]
      : [34.0, 9.5]; // central Tunisia

  return (
    <MapContainer
      center={initial}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {positioned.map((f) => (
        <Marker
          key={f.id}
          position={[f.lat as number, f.lng as number]}
          icon={fermeIcon}
        >
          <Popup>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-ink-900">{f.name}</p>
              <p className="text-xs text-ink-600">
                {String(f.rucheCount).padStart(2, "0")} ruches
              </p>
              {(f.plusCode || f.address) && (
                <p className="text-xs text-ink-500">
                  {[f.plusCode, f.address].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      <FitToFermes fermes={fermes} />
    </MapContainer>
  );
}
