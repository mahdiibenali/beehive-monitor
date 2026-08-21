"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { MockTimeSeries } from "./rucheMockData";

const PERIODS = [
  { id: "week", label: "Cette semaine" },
  { id: "1m", label: "1M" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
  { id: "1a", label: "1A" },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

interface TimeSeriesMiniChartProps {
  /** Section title shown above the chart. */
  title: string;
  series: MockTimeSeries;
  /** Optional period selector — defaults to true. */
  showPeriods?: boolean;
  /** Y axis tick count — defaults to 5. */
  yTicks?: number;
}

/**
 * Compact smoothed line chart with brand colors. Tone drives the stroke:
 *   • ok       → purple
 *   • warning  → orange
 *   • anomaly  → orange
 */
export function TimeSeriesMiniChart({
  title,
  series,
  showPeriods = true,
  yTicks = 5,
}: TimeSeriesMiniChartProps) {
  const [period, setPeriod] = useState<PeriodId>("week");

  const color = series.tone === "ok" ? "#5D4FEC" : "#F08A1D";

  // Vary the values slightly by period so the chart "responds" to the picker.
  const points = useMemo(() => {
    const factor =
      period === "week"
        ? 1
        : period === "1m"
        ? 0.95
        : period === "3m"
        ? 1.05
        : period === "6m"
        ? 1.1
        : 0.9;
    return series.points.map((p) => ({ ...p, value: +(p.value * factor).toFixed(1) }));
  }, [series.points, period]);

  const chart = useMemo(() => buildSmoothLine(points), [points]);

  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  // Build "nice" Y ticks.
  const yLabels = Array.from({ length: yTicks }, (_, i) =>
    Math.round((max - (i * range) / (yTicks - 1)) * 10) / 10
  );

  return (
    <div className="rounded-2xl">
      <header className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
        <span className="text-[10px] text-ink-400">04 — 06 Mai 2026</span>
      </header>

      {showPeriods && (
        <div className="mb-3 flex items-center gap-1.5 overflow-x-auto">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "shrink-0 rounded-pill px-3 py-1 text-xs font-medium transition-colors",
                period === p.id
                  ? "bg-brand-purple text-white"
                  : "bg-primary-50 text-ink-600 hover:bg-primary-100"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {/* Y axis */}
        <div className="flex flex-col justify-between py-1 text-[10px] text-ink-400">
          {yLabels.map((y) => (
            <span key={y}>{y}</span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-32 w-full"
            preserveAspectRatio="none"
          >
            {/* Light horizontal grid */}
            {yLabels.map((_, i) => {
              const y = (i * chart.height) / (yLabels.length - 1);
              return (
                <line
                  key={i}
                  x1={0}
                  x2={chart.width}
                  y1={y}
                  y2={y}
                  stroke="#EEF0F4"
                  strokeWidth={1}
                />
              );
            })}
            <path
              d={chart.path}
              fill="none"
              stroke={color}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {chart.dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={3} fill={color} />
            ))}
          </svg>

          {/* X labels */}
          <div className="mt-1 flex justify-between text-[10px] text-ink-400">
            {points.map((p) => (
              <span key={p.label} className="text-center">
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Chart helpers                                 */
/* -------------------------------------------------------------------------- */

function buildSmoothLine(points: Array<{ label: string; value: number }>) {
  const width = 100 * Math.max(points.length, 1);
  const height = 80;
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const padTop = 8;
  const padBottom = 8;
  const usableH = height - padTop - padBottom;

  const dots = points.map((p, i) => {
    const x = (i + 0.5) * (width / points.length);
    const y = padTop + (1 - (p.value - min) / range) * usableH;
    return { x, y };
  });

  return { width, height, dots, path: catmullRomPath(dots) };
}

function catmullRomPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const d: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}
