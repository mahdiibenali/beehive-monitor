/**
 * Client-side mock data for the ferme detail drawer.
 *
 * Until we have real Ruche / Météo models in the database, these helpers
 * generate deterministic per-ferme data so the UI looks lively and stays
 * stable across re-renders (same ferme id → same rows, same forecast).
 */
import type { FermeListItem } from "@/lib/fermes/types";

/* -------------------------------------------------------------------------- */
/*                           Deterministic PRNG                               */
/* -------------------------------------------------------------------------- */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: string) {
  let s = hash(seed) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/* -------------------------------------------------------------------------- */
/*                                  Ruches                                    */
/* -------------------------------------------------------------------------- */

export interface MockRuche {
  id: string;
  name: string;
  localisation: string;
  status: "alerte" | "normale";
  /** Active alert count on this ruche (0 → no alerts). */
  alerts: number;
  /** Deterministic position around the ferme center. */
  lat: number | null;
  lng: number | null;
}

const RUCHE_NAME_POOL = [
  "Ruche A1",
  "Ruche A2",
  "Ruche B1",
  "Ruche B2",
  "Ruche C1",
  "Ruche C2",
  "Ruche D1",
  "Ruche D2",
  "Ruxhz",
  "ruche 1",
  "ruche 2",
  "ruche 3",
];

/**
 * Build a fixed list of ruches for the given ferme. The number of rows
 * matches `ferme.ruches`, the number of alerted rows roughly matches
 * `ferme.ruchesAttention`. Always deterministic per ferme id.
 */
export function mockRuchesForFerme(ferme: FermeListItem): MockRuche[] {
  const total = Math.max(0, ferme.ruches);
  if (total === 0) return [];

  const rng = makeRng(`ruches:${ferme.id}`);
  const alertsBudget = Math.min(total, Math.max(0, ferme.ruchesAttention));
  const localisation = `${ferme.region} - ${ferme.pays}`;

  const indexes = Array.from({ length: total }, (_, i) => i);
  // Shuffle the indexes deterministically so the alerted rows aren't
  // always the first N.
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  const alertedIdx = new Set(indexes.slice(0, alertsBudget));

  const rows: MockRuche[] = [];
  for (let i = 0; i < total; i++) {
    const name =
      RUCHE_NAME_POOL[i % RUCHE_NAME_POOL.length] +
      (i >= RUCHE_NAME_POOL.length ? ` (${i + 1})` : "");
    const isAlerted = alertedIdx.has(i);

    // Scatter ruches deterministically within ~150-400m of the ferme.
    const hasCoords =
      typeof ferme.lat === "number" && typeof ferme.lng === "number";
    const jitterLat = (rng() - 0.5) * 0.006;
    const jitterLng = (rng() - 0.5) * 0.008;

    rows.push({
      id: `${ferme.id}-r${i + 1}`,
      name,
      localisation,
      status: isAlerted ? "alerte" : "normale",
      alerts: isAlerted ? 1 + Math.floor(rng() * 6) : 0,
      lat: hasCoords ? (ferme.lat as number) + jitterLat : null,
      lng: hasCoords ? (ferme.lng as number) + jitterLng : null,
    });
  }
  return rows;
}

/** Number of collecteurs currently running on this ferme (mock). */
export function mockCollecteursActifs(ferme: FermeListItem): number {
  const rng = makeRng(`collecteurs:${ferme.id}`);
  const cap = Math.max(1, Math.min(ferme.gateway, 6));
  return 1 + Math.floor(rng() * cap);
}

/* -------------------------------------------------------------------------- */
/*                                  Météo                                     */
/* -------------------------------------------------------------------------- */

export type WeatherKind = "sun" | "cloud" | "cloud-sun" | "cloud-rain";

export interface MockWeather {
  /** Current temp in Celsius. */
  currentTemp: number;
  /** Display label (defaults to ferme address / region). */
  location: string;
  kind: WeatherKind;
  precipitationMm: number;
  humidityPct: number;
  windKmh: number;
  hourly: Array<{
    hour: string; // "11h"
    temp: number;
    kind: WeatherKind;
    rainPct: number;
  }>;
  daily: Array<{
    label: string;
    rainPct: number;
    kind: WeatherKind;
    isNight: boolean;
    high: number;
    low: number;
  }>;
}

const KINDS: WeatherKind[] = ["sun", "cloud-sun", "cloud", "cloud-rain"];

function pickKind(rng: () => number, bias = 0): WeatherKind {
  // bias > 0 leans rainier, < 0 leans sunnier
  const r = Math.min(1, Math.max(0, rng() + bias));
  if (r < 0.25) return "sun";
  if (r < 0.5) return "cloud-sun";
  if (r < 0.8) return "cloud";
  return "cloud-rain";
}

const DAY_LABELS = [
  "Hier",
  "Aujourd'hui",
  "Samedi",
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
];

/**
 * Build a believable 6-hour + 7-day forecast for the given ferme.
 * Deterministic per ferme id.
 */
export function mockWeatherForFerme(ferme: FermeListItem): MockWeather {
  const rng = makeRng(`weather:${ferme.id}`);
  const baseTemp = 6 + Math.floor(rng() * 12);
  const kind = pickKind(rng);

  // 6 hours, slowly drifting around the current temp.
  const startHour = 11;
  const hourly = Array.from({ length: 6 }).map((_, i) => {
    const drift = Math.round((rng() - 0.5) * 6);
    return {
      hour: `${String(startHour + i).padStart(2, "0")}h`,
      temp: Math.max(-5, baseTemp + drift),
      kind: pickKind(rng, 0.1),
      rainPct: Math.floor(rng() * 35),
    };
  });

  const daily = DAY_LABELS.map((label, i) => {
    const high = baseTemp + 6 + Math.floor(rng() * 6);
    const low = Math.max(-5, baseTemp - 8 + Math.floor(rng() * 6));
    return {
      label,
      rainPct: Math.floor(rng() * 35),
      kind: pickKind(rng, i % 2 === 0 ? -0.05 : 0.1),
      isNight: i >= 1 && i % 2 === 0,
      high,
      low,
    };
  });

  return {
    currentTemp: baseTemp,
    location:
      ferme.address ||
      (ferme.region ? `${ferme.nom}, ${ferme.region}` : ferme.nom),
    kind,
    precipitationMm: Math.floor(rng() * 10),
    humidityPct: 35 + Math.floor(rng() * 50),
    windKmh: 4 + Math.floor(rng() * 18),
    hourly,
    daily,
  };
}
