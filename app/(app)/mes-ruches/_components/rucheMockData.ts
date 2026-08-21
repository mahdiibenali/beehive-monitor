/**
 * Deterministic mock metrics for a single ruche detail drawer.
 * Seeded from the ruche id so the same ruche always shows the same numbers.
 */
import type { RucheRow } from "./types";

export type AlertType = "batterie" | "capteur" | "venin" | "gateway";
export type AlertStatus = "resolue" | "non-resolue" | "en-cours";

export interface MockAlert {
  id: string;
  label: string;
  type: AlertType;
  status: AlertStatus;
  /** ISO timestamp. */
  date: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface MockTimeSeries {
  /** Series points; the rendering component picks N evenly spaced ones. */
  points: ChartPoint[];
  /** Display unit (e.g. "hPa", "V"). */
  unit: string;
  /** Whether the line should render orange (anomaly) or purple (normal). */
  tone: "ok" | "warning" | "anomaly";
}

export interface ScheduledSession {
  id: string;
  /** Localised date label (e.g. "Lun 12/06"). */
  dayLabel: string;
  /** Start time (HH:mm). */
  start: string;
  /** End time (HH:mm). */
  end: string;
}

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
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type AnomalyTone = "anomaly" | "warning" | "ok";

export interface RucheMetrics {
  // Banners
  reineEnceinte: boolean;
  collecteurActif: boolean;

  // Alerts
  alerts: MockAlert[];

  // Time series
  pressionSeries: MockTimeSeries;
  tensionSeries: MockTimeSeries;
  productionSeries: MockTimeSeries;

  // Planification
  sessions: ScheduledSession[];

  // Conditions internes
  temperature: { value: number; unit: "°"; tone: AnomalyTone };
  humidity: { value: number; unit: "%"; tone: AnomalyTone };
  anomalies: { label: string; tone: AnomalyTone };
  mouvement: { label: string; tone: AnomalyTone };
  pression: { value: number; unit: "hPa"; tone: AnomalyTone };
  vitesseAbeilles: { value: number; unit: "m/s"; tone: AnomalyTone };

  // Batterie et connexion
  batterieS: { percent: number; tone: AnomalyTone };
  batterieC: { label: string; tone: AnomalyTone };
  gatewayId: string;

  // Collecteur de venin
  activite: { label: string; tone: AnomalyTone };
  etatCables: { label: string; tone: AnomalyTone };
  tensionCables: { value: number; unit: "V"; tone: AnomalyTone };
  plaques: { percent: number; tone: AnomalyTone };

  // Stats strip
  collecteursActifs: number;
  alertesCount: number;
  gatewayCount: number;
}

/* -------------------------------------------------------------------------- */
/*                               Generator                                    */
/* -------------------------------------------------------------------------- */

export function mockMetricsForRuche(row: RucheRow): RucheMetrics {
  const rng = makeRng(`metrics:${row.id}`);
  const isAlerte = row.status === "alerte";

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)];
  }

  // Temperature trends hotter on alert rows.
  const baseTemp = isAlerte ? 38 + Math.floor(rng() * 12) : 26 + Math.floor(rng() * 8);
  const tempTone: AnomalyTone = baseTemp >= 38 ? "anomaly" : baseTemp >= 34 ? "warning" : "ok";

  const humidity = 25 + Math.floor(rng() * 50);
  const humidityTone: AnomalyTone = humidity < 30 || humidity > 75 ? "warning" : "ok";

  const anomalyState: AnomalyTone = isAlerte ? "anomaly" : rng() < 0.15 ? "warning" : "ok";
  const mouvementOptions: AnomalyTone[] = isAlerte
    ? ["anomaly", "warning"]
    : ["ok", "ok", "warning"];
  const mouvementTone = mouvementOptions[Math.floor(rng() * mouvementOptions.length)];

  const pression = 990 + Math.floor(rng() * 30);
  const pressionTone: AnomalyTone =
    pression < 1000 || pression > 1020 ? "warning" : "ok";

  const vitesse = +(rng() * 2.5).toFixed(1);

  // Batterie-S percentage (sensor battery)
  const batSPercent = Math.max(5, Math.floor(rng() * 100));
  const batSTone: AnomalyTone =
    batSPercent < 15 ? "anomaly" : batSPercent < 30 ? "warning" : "ok";

  // Batterie-C state (collector battery)
  const batCStates: Array<{ label: string; tone: AnomalyTone }> = [
    { label: "En chargé", tone: "ok" },
    { label: "Pleine", tone: "ok" },
    { label: "Faible", tone: "warning" },
    { label: "Critique", tone: "anomaly" },
  ];
  const batC = batCStates[Math.floor(rng() * batCStates.length)];

  // Venom collector cables condition
  const cableStates: Array<{ label: string; tone: AnomalyTone }> = isAlerte
    ? [
        { label: "Endommagé", tone: "anomaly" },
        { label: "Dégradé", tone: "warning" },
      ]
    : [
        { label: "Bon état", tone: "ok" },
        { label: "Bon état", tone: "ok" },
        { label: "Dégradé", tone: "warning" },
      ];
  const cables = cableStates[Math.floor(rng() * cableStates.length)];

  const activiteStates: Array<{ label: string; tone: AnomalyTone }> = [
    { label: "Actif", tone: "ok" },
    { label: "Actif", tone: "ok" },
    { label: "Inactif", tone: "warning" },
  ];
  const activite = activiteStates[Math.floor(rng() * activiteStates.length)];

  const tension = 8 + Math.floor(rng() * 7);
  const plaquesPercent = Math.floor(rng() * 100);

  // Alerts pool — pick N alerts (more on alerted ruches) and tag them with
  // a category so each tab can filter on its own type.
  const baseAlertCount = isAlerte ? 6 + Math.floor(rng() * 8) : 2 + Math.floor(rng() * 4);
  const labels: Array<{ label: string; type: AlertType }> = [
    { label: "Batterie faible", type: "batterie" },
    { label: "Batterie critique", type: "batterie" },
    { label: "Pression élevée", type: "capteur" },
    { label: "Pression basse", type: "capteur" },
    { label: "Température élevée", type: "capteur" },
    { label: "Humidité faible", type: "capteur" },
    { label: "Câbles endommagés", type: "venin" },
    { label: "Tension basse", type: "venin" },
    { label: "Production interrompue", type: "venin" },
    { label: "Gateway hors-ligne", type: "gateway" },
    { label: "Connexion lente", type: "gateway" },
  ];
  const alerts: MockAlert[] = [];
  for (let i = 0; i < baseAlertCount; i++) {
    const tpl = labels[Math.floor(rng() * labels.length)];
    const statusRoll = rng();
    const status: AlertStatus =
      statusRoll < 0.45 ? "non-resolue" : statusRoll < 0.75 ? "en-cours" : "resolue";
    // Spread dates over the last ~10 days.
    const daysAgo = Math.floor(rng() * 10);
    const hour = 8 + Math.floor(rng() * 11);
    const minute = Math.floor(rng() * 60);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    alerts.push({
      id: `${row.id}-a${i + 1}`,
      label: tpl.label,
      type: tpl.type,
      status,
      date: d.toISOString(),
    });
  }

  // Time series — 6 evenly spaced points each.
  function makeSeries(
    base: number,
    spread: number,
    labels: string[],
    tone: MockTimeSeries["tone"],
    unit: string
  ): MockTimeSeries {
    return {
      unit,
      tone,
      points: labels.map((label) => ({
        label,
        value: Math.round((base + (rng() - 0.5) * spread) * 10) / 10,
      })),
    };
  }
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun"];
  const pressionSeries = makeSeries(
    pression,
    18,
    monthLabels,
    pressionTone === "ok" ? "ok" : "warning",
    "hPa"
  );
  const tensionSeries = makeSeries(
    tension,
    4,
    ["L", "M", "M", "J", "V", "S", "D"].slice(0, 7),
    "ok",
    "V"
  );
  const productionSeries = makeSeries(
    30,
    25,
    monthLabels,
    isAlerte ? "warning" : "ok",
    "mL"
  );

  // Planification sessions — 1 to 3 upcoming.
  const sessionCount = 1 + Math.floor(rng() * 3);
  const sessions: ScheduledSession[] = [];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  for (let i = 0; i < sessionCount; i++) {
    const d = new Date();
    d.setDate(d.getDate() + 1 + Math.floor(rng() * 14));
    const dayName = dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1];
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const startH = 7 + Math.floor(rng() * 9);
    const startM = pick<number>([0, 15, 30, 45]);
    sessions.push({
      id: `${row.id}-sess${i + 1}`,
      dayLabel: `${dayName} ${dd}/${mm}`,
      start: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
      end: `${String(startH + 1).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
    });
  }

  return {
    reineEnceinte: !isAlerte && rng() < 0.55,
    collecteurActif: rng() < 0.6,
    alerts,
    pressionSeries,
    tensionSeries,
    productionSeries,
    sessions,
    temperature: { value: baseTemp, unit: "°", tone: tempTone },
    humidity: { value: humidity, unit: "%", tone: humidityTone },
    anomalies: {
      label:
        anomalyState === "anomaly"
          ? "Anormal"
          : anomalyState === "warning"
          ? "Suspect"
          : "Normal",
      tone: anomalyState,
    },
    mouvement: {
      label:
        mouvementTone === "anomaly"
          ? "Faible"
          : mouvementTone === "warning"
          ? "Faible"
          : "Normal",
      tone: mouvementTone,
    },
    pression: {
      value: pression,
      unit: "hPa",
      tone: pressionTone,
    },
    vitesseAbeilles: { value: vitesse, unit: "m/s", tone: "ok" },

    batterieS: { percent: batSPercent, tone: batSTone },
    batterieC: batC,
    gatewayId: `GW-${100 + Math.floor(rng() * 900)}`,

    activite,
    etatCables: cables,
    tensionCables: { value: tension, unit: "V", tone: "ok" },
    plaques: {
      percent: plaquesPercent,
      tone: plaquesPercent < 15 ? "anomaly" : "ok",
    },

    collecteursActifs: 1 + Math.floor(rng() * 3),
    alertesCount: isAlerte ? row.alerts || 1 + Math.floor(rng() * 6) : 0,
    gatewayCount: 1 + Math.floor(rng() * 3),
  };
}
