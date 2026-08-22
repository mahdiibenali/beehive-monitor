import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Telemetry } from "@/models/Telemetry";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

function getChartConfig(filter: string) {
  const now = new Date();
  const buckets: { start: number; end: number; value: number }[] = [];
  const labels: string[] = [];

  if (filter === "1M") {
    // Last 4 weeks
    for (let i = 4; i >= 1; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - (i * 7));
      const end = new Date(d);
      end.setDate(end.getDate() + 7);
      buckets.push({ start: d.getTime(), end: end.getTime(), value: 0 });
      labels.push(`Semaine ${5 - i}`);
    }
  } else if (filter === "3M") {
    // Last 3 months
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ start: d.getTime(), end: end.getTime(), value: 0 });
      labels.push(d.toLocaleDateString('fr-FR', { month: 'short' }));
    }
  } else if (filter === "6M") {
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ start: d.getTime(), end: end.getTime(), value: 0 });
      labels.push(d.toLocaleDateString('fr-FR', { month: 'short' }));
    }
  } else if (filter === "1A") {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ start: d.getTime(), end: end.getTime(), value: 0 });
      labels.push(d.toLocaleDateString('fr-FR', { month: 'short' }));
    }
  }
  return { labels, buckets };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeFilter = searchParams.get("filter") || "1S";
  const hiveId = searchParams.get("hiveId");

  if (!hiveId) {
    return NextResponse.json({ error: "Missing hiveId" }, { status: 400 });
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "hives.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    
    // We just query the last 1000 telemetry docs (could optimize by date)
    const telemetryDocs = await Telemetry.find({})
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean();

    const tempSeries = { labels: [] as string[], values: [] as number[] };
    const humSeries = { labels: [] as string[], values: [] as number[] };
    const presSeries = { labels: [] as string[], values: [] as number[] };

    if (timeFilter !== "1S") {
      const config = getChartConfig(timeFilter);
      const buckets = config.buckets.map(b => ({ ...b, temps: [] as number[], hums: [] as number[], press: [] as number[] }));
      
      for (const t of telemetryDocs) {
        const timeMs = new Date(t.timestamp).getTime();
        const payload = t.payload as any;
        const endDeviceData = Array.isArray(payload?.end_device_data) ? payload.end_device_data : [];
        const hiveData = endDeviceData.find((d: any) => d.device_id === hiveId);
        
        if (hiveData && hiveData.sensors) {
          for (const b of buckets) {
            if (timeMs >= b.start && timeMs < b.end) {
              if (hiveData.sensors.temperature != null) b.temps.push(hiveData.sensors.temperature);
              if (hiveData.sensors.humidity != null) b.hums.push(hiveData.sensors.humidity);
              if (hiveData.sensors.pressure != null) b.press.push(hiveData.sensors.pressure);
              break;
            }
          }
        }
      }

      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      // Extract all values for global average fallback
      const allTemps: number[] = [];
      const allHums: number[] = [];
      const allPress: number[] = [];
      
      telemetryDocs.forEach(t => {
        const payload = t.payload as any;
        const endDeviceData = Array.isArray(payload?.end_device_data) ? payload.end_device_data : [];
        const hiveData = endDeviceData.find((d: any) => d.device_id === hiveId);
        if (hiveData && hiveData.sensors) {
          if (hiveData.sensors.temperature != null) allTemps.push(hiveData.sensors.temperature);
          if (hiveData.sensors.humidity != null) allHums.push(hiveData.sensors.humidity);
          if (hiveData.sensors.pressure != null) allPress.push(hiveData.sensors.pressure);
        }
      });
      
      const globalAvgTemp = avg(allTemps);
      const globalAvgHum = avg(allHums);
      const globalAvgPress = avg(allPress);

      tempSeries.labels = config.labels;
      tempSeries.values = buckets.map(b => Number((b.temps.length > 0 ? avg(b.temps) : globalAvgTemp).toFixed(1)));
      
      humSeries.labels = config.labels;
      humSeries.values = buckets.map(b => Math.round(b.hums.length > 0 ? avg(b.hums) : globalAvgHum));
      
      presSeries.labels = config.labels;
      presSeries.values = buckets.map(b => Math.round(b.press.length > 0 ? avg(b.press) : globalAvgPress));

    } else {
      // Real-time plotting for 1S
      const chronological = [...telemetryDocs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
        const endDeviceData = Array.isArray(payload?.end_device_data) ? payload.end_device_data : [];
        const hiveData = endDeviceData.find((d: any) => d.device_id === hiveId);
        
        if (hiveData && hiveData.sensors) {
          const timeLabel = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          tempSeries.labels.push(timeLabel);
          tempSeries.values.push(Number((hiveData.sensors.temperature ?? 0).toFixed(1)));
          
          humSeries.labels.push(timeLabel);
          humSeries.values.push(Math.round(hiveData.sensors.humidity ?? 0));
          
          presSeries.labels.push(timeLabel);
          presSeries.values.push(Math.round(hiveData.sensors.pressure ?? 0));
        }
      });
    }

    return NextResponse.json({
      temperature: tempSeries,
      humidity: humSeries,
      pressure: presSeries
    });
  } catch (error) {
    console.error("GET /api/mobile/hive-charts error:", error);
    return NextResponse.json({ error: "Failed to fetch hive charts" }, { status: 500 });
  }
}
