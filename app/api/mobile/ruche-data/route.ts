import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { findApiculteurForSession } from "@/lib/apiculteurs/resolve-by-session";
import { toFermeListItem } from "@/lib/fermes/serializer";
import type { FermeListItem } from "@/lib/fermes/types";
import { Alert } from "@/models/Alert";
import { Telemetry } from "@/models/Telemetry";

export const dynamic = "force-dynamic";

type AlertStatus = "Resolue" | "En cours" | "Non resolue";
type AlertTone = "orange" | "red" | "purple";

interface MobileHive {
  id: string;
  name: string;
  farmName: string;
  isCritical: boolean;
  batteryS: number | null;
  batteryC: number | null;
  productionMg: number | null;
  plaque: number | null;
  cableTension: number | null;
  lastSeen: string | null;
  lastDate: string | null;
  temperatureC: number | null;
  humidityPct: number | null;
  pressureHpa: number | null;
  beeSpeedMs: number | null;
  alerts: number;
}

interface MobileAlert {
  id: string;
  hiveId: string;
  hiveName: string;
  farmName: string;
  title: string;
  status: AlertStatus;
  tone: AlertTone;
  date: string | null;
  time: string | null;
  category: string;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(value: Date) {
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
}

function formatTime(value: Date) {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function makeHives(
  ferme: FermeListItem,
  rawRuches: any[] = [],
  fIndex: number = 0,
  sessions: any[] = [],
  alertDocs: any[] = [],
  telemetryDocs: any[] = [],
  gatewaySerials: string[] = []
): MobileHive[] {
  const total = Math.max(0, ferme.ruches);
  const now = new Date();

  // Find the latest telemetry for this farm's gateways (docs are already sorted by timestamp desc)
  const latestTelemetry = telemetryDocs.find(t => gatewaySerials.includes(t.gatewayId));
  const endDeviceList = Array.isArray((latestTelemetry?.payload as any)?.end_device_data) 
    ? (latestTelemetry?.payload as any).end_device_data 
    : [];
  
  // Use actual ruches if they exist in the DB, otherwise fallback to virtual ones (same as simulator)
  const rucheList = (Array.isArray(rawRuches) && rawRuches.length > 0)
    ? rawRuches
    : Array.from({ length: total }, (_, i) => ({ 
        _id: `${ferme.id}-ruche-${i + 1}`,
        name: `Ruche ${String(i + 1).padStart(2, "0")}` 
      }));

  return rucheList.map((ruche, index) => {
    const id = ruche._id?.toString();
    const isCritical = alertDocs.some(a => a.hiveId === id && a.status !== "Resolue");
    const offset = index + fIndex;
    const baseTemp = 30 + (offset % 5) + (Math.sin(offset) * 2);
    
    // Sum real grams for this hive, convert to mg
    const actualProductionMg = sessions
      .filter((s) => s.hiveId === id)
      .reduce((sum, s) => sum + (s.grams || 0) * 1000, 0);

    const hiveTelemetry = endDeviceList.find((d: any) => d.device_id === id);

    return {
      id,
      name: ruche.name || `Ruche ${String(index + 1).padStart(2, "0")}`,
      farmName: ferme.nom,
      isCritical,
      batteryS: 40 + (offset * 13) % 60,
      batteryC: 20 + (offset * 7) % 80,
      productionMg: actualProductionMg,
      plaque: offset % 2 === 0 ? 1 : 0,
      cableTension: 5 + (offset * 0.5) % 3,
      lastSeen: formatTime(now),
      lastDate: formatDate(now),
      temperatureC: hiveTelemetry?.sensors?.temperature ?? Number(baseTemp.toFixed(1)),
      humidityPct: hiveTelemetry?.sensors?.humidity ?? (40 + (offset * 5) % 30),
      pressureHpa: hiveTelemetry?.sensors?.pressure ?? (1010 + (offset * 2) % 10),
      beeSpeedMs: 1.2 + (offset * 0.1) % 1.5,
      alerts: isCritical ? 1 : 0,
    };
  });
}



const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jui", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];

function getChartConfig(filter: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const labels: string[] = [];
  const buckets: { start: number, end: number, value: number }[] = [];
  
  if (filter === "1S") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      labels.push(DAYS[d.getDay()]);
      buckets.push({ start: d.getTime(), end: d.getTime() + 86400000, value: 0 });
    }
  } else if (filter === "1M") {
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i * 7 + 6));
      const end = new Date(now);
      end.setDate(now.getDate() - (i * 7));
      labels.push(`Sem ${4 - i}`);
      buckets.push({ start: start.getTime(), end: end.getTime() + 86400000, value: 0 });
    }
  } else if (filter === "3M" || filter === "6M" || filter === "1A") {
    const months = filter === "3M" ? 3 : filter === "6M" ? 6 : 12;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      labels.push(MONTHS[m < 0 ? m + 12 : m]);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ start: d.getTime(), end: nextMonth.getTime(), value: 0 });
    }
  } else {
    return getChartConfig("1S");
  }
  return { labels, buckets };
}

function parseSessionDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const parts = dateStr.split(" ");
  const datePart = parts[1] || parts[0];
  if (datePart && datePart.includes("/")) {
    const [day, month] = datePart.split("/").map(Number);
    if (!isNaN(day) && !isNaN(month)) {
      return new Date(new Date().getFullYear(), month - 1, day);
    }
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function aggregateSessions(sessions: any[], filter: string) {
  const config = getChartConfig(filter);
  
  for (const s of sessions) {
    if (!s.date) continue;
    const d = parseSessionDate(s.date);
    if (!d) continue;
    
    for (const b of config.buckets) {
      if (d.getTime() >= b.start && d.getTime() < b.end) {
        b.value += ((s.grams || 0) * 1000);
        break;
      }
    }
  }
  return { labels: config.labels, values: config.buckets.map(b => b.value) };
}

function aggregateActivite(sessions: any[], filter: string) {
  const config = getChartConfig(filter);
  for (const s of sessions) {
    if (!s.date) continue;
    const d = parseSessionDate(s.date);
    if (!d) continue;
    for (const b of config.buckets) {
      if (d.getTime() >= b.start && d.getTime() < b.end) {
        b.value += 1;
        break;
      }
    }
  }
  return { labels: config.labels, values: config.buckets.map(b => b.value) };
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeFilter = searchParams.get("filter") || "1S";

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "hives.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const apiculteur = await findApiculteurForSession(session);
    if (!apiculteur) {
      return NextResponse.json(
        { error: "Profil apiculteur introuvable." },
        { status: 404 }
      );
    }

    const fermes = (apiculteur.fermes ?? []).map((ferme) =>
      toFermeListItem(ferme, apiculteur.region ?? "")
    );
    
    const allSessions: any[] = [];

    const alertDocs = await Alert.find({ userId: session.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const allGatewaySerials = (apiculteur.fermes ?? []).flatMap((f, fIndex) => {
      const serials = (f.gateways || []).map((g: any) => g.serialNumber);
      if (serials.length === 0) {
        serials.push(`GW_MASTER_${f._id.toString().slice(-6).toUpperCase()}`);
      }
      return serials;
    });

    const telemetryDocs = await Telemetry.find({ gatewayId: { $in: allGatewaySerials } })
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean();

    const farms = (apiculteur.fermes ?? []).map((rawFerme, fIndex) => {
      const ferme = toFermeListItem(rawFerme, apiculteur.region ?? "");
      const sessions = (rawFerme.gateways || []).flatMap((g: any) => g.sessions || []);
      const gatewaySerials = (rawFerme.gateways || []).map((g: any) => g.serialNumber);
      if (gatewaySerials.length === 0) {
        gatewaySerials.push(`GW_MASTER_${rawFerme._id.toString().slice(-6).toUpperCase()}`);
      }
      const hives = makeHives(ferme, rawFerme.ruches || [], fIndex, sessions, alertDocs, telemetryDocs, gatewaySerials);
      const generateSeries = (base: number, variance: number, points: number) => {
        return {
          labels: Array.from({ length: points }, (_, i) => `J${i + 1}`),
          values: Array.from({ length: points }, (_, i) => Number((base + Math.sin(i + fIndex) * variance + (Math.random() * variance * 0.5)).toFixed(1)))
        };
      };

      allSessions.push(...sessions);
      
      const realProduction = aggregateSessions(sessions, timeFilter);
      const realActivite = aggregateActivite(sessions, timeFilter);
      const farmTelemetry = telemetryDocs.filter(t => gatewaySerials.includes(t.gatewayId));

      const batterySSeries = { labels: [] as string[], values: [] as number[] };
      const batteryCSeries = { labels: [] as string[], values: [] as number[] };
      const tensionSeries = { labels: [] as string[], values: [] as number[] };
      
      if (timeFilter !== "1S") {
        // Historical bucketing for 1M, 3M, 6M, 1A
        const config = getChartConfig(timeFilter);
        const buckets = config.buckets.map(b => ({ ...b, batteryS: [] as number[], batteryC: [] as number[], tension: [] as number[] }));
        
        for (const t of farmTelemetry) {
          const timeMs = new Date(t.timestamp).getTime();
          const payload = t.payload as any;
          for (const b of buckets) {
            if (timeMs >= b.start && timeMs < b.end) {
              if (payload?.power_system?.battery_soc != null) b.batteryS.push(payload.power_system.battery_soc);
              if (payload?.power_system?.battery_voltage != null) b.batteryC.push(payload.power_system.battery_voltage);
              if (payload?.venom_module?.excitation_voltage != null) b.tension.push(payload.venom_module.excitation_voltage);
              break;
            }
          }
        }
        
        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        
        const globalAvgBatteryS = avg(farmTelemetry.map(t => (t.payload as any)?.power_system?.battery_soc).filter(v => v != null));
        const globalAvgBatteryC = avg(farmTelemetry.map(t => (t.payload as any)?.power_system?.battery_voltage).filter(v => v != null));
        const globalAvgTension = avg(farmTelemetry.map(t => (t.payload as any)?.venom_module?.excitation_voltage).filter(v => v != null));

        batterySSeries.labels = config.labels;
        batterySSeries.values = buckets.map(b => Math.round(b.batteryS.length > 0 ? avg(b.batteryS) : globalAvgBatteryS));
        
        batteryCSeries.labels = config.labels;
        batteryCSeries.values = buckets.map(b => Math.round(b.batteryC.length > 0 ? avg(b.batteryC) : globalAvgBatteryC));
        
        tensionSeries.labels = config.labels;
        tensionSeries.values = buckets.map(b => Math.round(b.tension.length > 0 ? avg(b.tension) : globalAvgTension));

      } else {
        // Real-time plotting for 1S
        const chronological = [...farmTelemetry].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const distinctTicks: any[] = [];
        for (const t of chronological) {
          const timeMs = new Date(t.timestamp).getTime();
          const prev = distinctTicks.length > 0 ? distinctTicks[distinctTicks.length - 1] : null;
          if (!prev || timeMs - new Date(prev.timestamp).getTime() > 1000) {
            distinctTicks.push(t);
          }
        }
        const sample = distinctTicks.length > 6 ? distinctTicks.slice(-6) : distinctTicks;
        sample.forEach(t => {
          const payload = t.payload as any;
          const timeLabel = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          batterySSeries.labels.push(timeLabel);
          batterySSeries.values.push(Math.round(payload?.power_system?.battery_soc ?? 0));
          batteryCSeries.labels.push(timeLabel);
          batteryCSeries.values.push(Math.round(payload?.power_system?.battery_voltage ?? 0));
          tensionSeries.labels.push(timeLabel);
          tensionSeries.values.push(Math.round(payload?.venom_module?.excitation_voltage ?? 0));
        });
      }

      const latestTelemetry = farmTelemetry[0];
      const latestBatteryS = latestTelemetry?.payload?.power_system?.battery_soc ?? null;
      const latestBatteryC = latestTelemetry?.payload?.power_system?.battery_voltage ?? null;
      const cablesStatus = latestTelemetry?.payload?.venom_module?.grid_integrity === "OK" ? "OK" : (latestTelemetry ? "Défaut" : "Inconnu");

      return {
        ferme,
        hives,
        collecteursActifs: (() => {
          const now = new Date();
          let count = 0;
          for (const g of rawFerme.gateways || []) {
            const hasSessionToday = (g.sessions || []).some((s: any) => {
              if (!s.date) return false;
              const sessionDate = parseSessionDate(s.date);
              if (!sessionDate) return false;
              return (
                sessionDate.getFullYear() === now.getFullYear() &&
                sessionDate.getMonth() === now.getMonth() &&
                sessionDate.getDate() === now.getDate()
              );
            });
            if (hasSessionToday) {
              count++;
            }
          }
          return count;
        })(),
        gatewaySerial: `GW-${String(Math.max(1, ferme.gateway)).padStart(3, "0")}`,
        latestBatteryS,
        latestBatteryC,
        cablesStatus,
        weather: {
          currentTemp: 24 + (fIndex % 5),
          location: ferme.address || ferme.region || ferme.nom,
          precipitationMm: (fIndex * 2.5) % 10,
          humidityPct: 45 + (fIndex * 5) % 20,
          windKmh: 12 + (fIndex * 3) % 15,
        },
        series: {
          production: realProduction,
          tension: tensionSeries.values.length > 0 ? tensionSeries : generateSeries(6, 1, 24),
          pressure: generateSeries(1015, 3, 24),
          batteryS: batterySSeries.values.length > 0 ? batterySSeries : generateSeries(85, 4, 6),
          batteryC: batteryCSeries.values.length > 0 ? batteryCSeries : generateSeries(70, 5, 6),
          cables: generateSeries(98, 2, 6), // Kept for type safety though unused now
          activite: realActivite
        },
      };
    });
    
    const globalSeries = {
      production: aggregateSessions(allSessions, timeFilter)
    };

    const mappedAlerts: MobileAlert[] = alertDocs.map(doc => ({
      id: doc._id.toString(),
      hiveId: doc.hiveId,
      hiveName: doc.hiveName,
      farmName: doc.farmName,
      title: doc.title,
      status: doc.status as AlertStatus,
      tone: doc.tone as AlertTone,
      date: doc.date ?? null,
      time: doc.time ?? null,
      category: doc.category,
    }));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      farms,
      alerts: mappedAlerts,
      globalSeries,
    });
  } catch (error) {
    console.error("GET /api/mobile/ruche-data error:", error);
    return NextResponse.json(
      { error: "Impossible de charger les donnees mobiles." },
      { status: 500 }
    );
  }
}
