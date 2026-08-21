"use client";

import { useMemo } from "react";
import { Droplets, Layers, Wheat, Wifi } from "@/lib/icons";
import { MetricCard } from "./MetricCard";
import {
  ApiculteurAlertsCard,
  type AlertRow,
} from "./ApiculteurAlertsCard";
import {
  VenomProductionCard,
  type VenomRange,
} from "./VenomProductionCard";
import { ApiculteurMapCard, type MapMarker } from "./ApiculteurMapCard";

/* -------------------------------------------------------------------------- */
/*                                  Mock data                                 */
/* -------------------------------------------------------------------------- */
/*                                                                            */
/*  Real apiculteur-side endpoints (alerts feed, venom production timeseries  */
/*  and per-ferme geolocation) don't exist yet. We seed the page with         */
/*  realistic mock data so the design lands; once the APIs are in place       */
/*  the page just swaps `useMemo` for an API hook with the same shape.        */
/*                                                                            */
/* -------------------------------------------------------------------------- */

const MOCK_ALERTS: AlertRow[] = [
  {
    id: "1",
    alert: "Batterie faible",
    type: "Batterie",
    ferme: "Senyet samir ben sami",
    localisation: "Beja - Tunisie",
    occurredAt: "2026-06-09T10:20:00.000Z",
    status: "resolue",
  },
  {
    id: "2",
    alert: "Batterie faible",
    type: "Venin",
    ferme: "Senyet samir ben sami",
    localisation: "Beja - Tunisie",
    occurredAt: "2026-06-09T10:20:00.000Z",
    status: "non-resolue",
  },
  {
    id: "3",
    alert: "Pression élevée",
    type: "Capteur",
    ferme: "Ferme Ben samir",
    localisation: "Beja - Tunisie",
    occurredAt: "2026-06-09T10:20:00.000Z",
    status: "en-cours",
  },
  {
    id: "4",
    alert: "Pression élevée",
    type: "Venin",
    ferme: "Ferme Ben samir",
    localisation: "Beja - Tunisie",
    occurredAt: "2026-06-09T10:20:00.000Z",
    status: "non-resolue",
  },
];

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun"];
const WEEK_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const VENOM_SERIES: Record<VenomRange, { label: string; value: number }[]> = {
  week: WEEK_LABELS.map((label, i) => ({
    label,
    value: [8, 12, 14, 11, 18, 22, 16][i] ?? 10,
  })),
  "1M": MONTH_LABELS.map((label, i) => ({
    label,
    value: [10, 22, 18, 36, 58, 28][i] ?? 0,
  })),
  "3M": ["Mai S1", "Mai S2", "Mai S3", "Mai S4", "Jun S1", "Jun S2"].map(
    (label, i) => ({
      label,
      value: [22, 28, 35, 41, 38, 30][i] ?? 0,
    })
  ),
  "6M": ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun"].map((label, i) => ({
    label,
    value: [12, 18, 26, 32, 48, 36][i] ?? 0,
  })),
  "1Y": [
    "Jan",
    "Fev",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].map((label, i) => ({
    label,
    value: [14, 18, 22, 30, 38, 44, 50, 42, 36, 28, 22, 18][i] ?? 0,
  })),
};

const MOCK_MAP_MARKERS: MapMarker[] = [
  // Sprinkle of "Normale" (purple) and "Alertes" (orange) dots across
  // northern Tunisia. Coordinates are real, the markers are mock.
  { id: "m1", label: "Béja", lat: 36.73, lng: 9.18, tone: "alert" },
  { id: "m2", label: "Tunis", lat: 36.81, lng: 10.18, tone: "normal" },
  { id: "m3", label: "Bizerte", lat: 37.27, lng: 9.87, tone: "normal" },
  { id: "m4", label: "Nabeul", lat: 36.45, lng: 10.74, tone: "alert" },
  { id: "m5", label: "Jendouba", lat: 36.5, lng: 8.78, tone: "normal" },
  { id: "m6", label: "Le Kef", lat: 36.18, lng: 8.71, tone: "alert" },
  { id: "m7", label: "Sousse", lat: 35.83, lng: 10.64, tone: "normal" },
  { id: "m8", label: "Kairouan", lat: 35.68, lng: 10.1, tone: "alert" },
  { id: "m9", label: "Zaghouan", lat: 36.4, lng: 10.14, tone: "normal" },
  { id: "m10", label: "Siliana", lat: 36.08, lng: 9.37, tone: "normal" },
  { id: "m11", label: "Monastir", lat: 35.78, lng: 10.83, tone: "normal" },
  { id: "m12", label: "Mahdia", lat: 35.5, lng: 11.06, tone: "alert" },
];

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

/**
 * Apiculteur dashboard.
 *
 * Layout (top → bottom):
 *   1. 4 metric cards         — Gateway / Récoltes / Ruches / Fermes
 *   2. Dernières alertes      — recent alerts table + "Voir plus" CTA
 *   3. Venom + map row        — production line chart (left) and
 *                                geographic distribution map (right)
 *
 * Data is mocked client-side for now. When the apiculteur API endpoints
 * land, swap the `useMemo` blocks for the matching `useSWR` / `useQuery`
 * hooks — the shape of each child component's props is already what the
 * real responses will look like.
 */
export function ApiculteurDashboard() {
  const alerts = useMemo(() => MOCK_ALERTS, []);
  const markers = useMemo(() => MOCK_MAP_MARKERS, []);

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Top metrics row */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Gateway"
          value="300"
          delta="+14 ce mois"
          icon={<Wifi className="h-4 w-4" strokeWidth={2} />}
        />
        <MetricCard
          label="Récoltes"
          value="102 g"
          delta="+13g ce mois"
          icon={<Droplets className="h-4 w-4" strokeWidth={2} />}
        />
        <MetricCard
          label="Ruches"
          value="102"
          icon={<Layers className="h-4 w-4" strokeWidth={2} />}
        />
        <MetricCard
          label="Fermes"
          value="40"
          icon={<Wheat className="h-4 w-4" strokeWidth={2} />}
        />
      </div>

      {/* Recent alerts */}
      <ApiculteurAlertsCard rows={alerts} />

      {/* Venom production + map */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <VenomProductionCard
          series={VENOM_SERIES}
          subtitle="04-06 Mai 2026"
        />
        <ApiculteurMapCard
          alertCount={markers.filter((m) => m.tone === "alert").length * 8}
          markers={markers}
        />
      </div>
    </div>
  );
}
