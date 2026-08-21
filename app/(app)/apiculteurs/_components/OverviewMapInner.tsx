"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L, { LatLngBounds, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

export type OverviewPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "active" | "expired" | "suspended";
};

interface OverviewMapInnerProps {
  points: OverviewPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const STATUS_COLOR: Record<OverviewPoint["status"], string> = {
  active: "#5D4FEC", // brand-purple
  expired: "#E89441", // brand-orange
  suspended: "#E76E5C", // red
};

/** Build a small dot icon for a given status color. */
function dotIcon(color: string, highlighted = false) {
  const size = highlighted ? 22 : 16;
  const ring = highlighted ? 4 : 2;
  return L.divIcon({
    className: "apiculteur-marker",
    html: `
      <span style="
        display:block;width:${size}px;height:${size}px;
        background:${color};
        border:${ring}px solid #FFFFFF;
        border-radius:9999px;
        box-shadow:0 1px 4px rgba(0,0,0,0.25);
      "></span>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const ICONS = {
  active: dotIcon(STATUS_COLOR.active),
  expired: dotIcon(STATUS_COLOR.expired),
  suspended: dotIcon(STATUS_COLOR.suspended),
};
const ICONS_SELECTED = {
  active: dotIcon(STATUS_COLOR.active, true),
  expired: dotIcon(STATUS_COLOR.expired, true),
  suspended: dotIcon(STATUS_COLOR.suspended, true),
};

/** Bounding box covering all of Tunisia — used as initial fallback. */
const TUNISIA_BOUNDS: LatLngBounds = new LatLngBounds(
  [30.2, 7.5],
  [37.5, 11.6]
);

function FitView({ points }: { points: OverviewPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.fitBounds(TUNISIA_BOUNDS, { animate: false });
      return;
    }
    if (points.length === 1) {
      const p = points[0];
      map.setView([p.lat, p.lng], 9, { animate: true });
      return;
    }
    const bounds = new LatLngBounds(
      points.map((p) => [p.lat, p.lng]) as LatLngTuple[]
    );
    map.fitBounds(bounds.pad(0.15), { animate: true });
  }, [points, map]);
  return null;
}

export default function OverviewMapInner({
  points,
  selectedId,
  onSelect,
}: OverviewMapInnerProps) {
  const validPoints = useMemo(
    () =>
      points.filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number"
      ),
    [points]
  );

  return (
    <MapContainer
      bounds={TUNISIA_BOUNDS}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validPoints.map((p) => {
        const isSelected = selectedId === p.id;
        const icon = isSelected
          ? ICONS_SELECTED[p.status]
          : ICONS[p.status];
        return (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={icon}
            eventHandlers={
              onSelect
                ? {
                    click: () => onSelect(p.id),
                  }
                : undefined
            }
          >
            <Popup>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                <p className="text-xs capitalize text-ink-500">{p.status}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
      <FitView points={validPoints} />
    </MapContainer>
  );
}
