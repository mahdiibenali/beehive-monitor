"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type VenomRange = "week" | "1M" | "3M" | "6M" | "1Y";

interface VenomDatum {
  /** Short axis label, e.g. "Jan" or "Lun". */
  label: string;
  /** Production in grams. */
  value: number;
}

interface VenomProductionCardProps {
  /** Pre-computed series per range. The card just renders what it's given. */
  series: Record<VenomRange, VenomDatum[]>;
  /**
   * Right-side subtitle, typically the formatted date range covered by
   * the active selection (e.g. "04-06 Mai 2026").
   */
  subtitle?: string;
}

const RANGE_OPTIONS: { value: VenomRange; label: string }[] = [
  { value: "week", label: "Cette semaine" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1A" },
];

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

/**
 * "Production venin (g)" card — line chart with a segmented range picker
 * above. The chart is a hand-rolled SVG so we don't pull in a charting
 * library just for one widget.
 */
export function VenomProductionCard({
  series,
  subtitle,
}: VenomProductionCardProps) {
  const [range, setRange] = useState<VenomRange>("1M");
  const data = series[range] ?? [];

  return (
    <section className="rounded-[18px] bg-white p-5 shadow-card md:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">
            Production venin (g)
          </h2>
        </div>
        {subtitle && (
          <span className="text-[11px] text-ink-500">{subtitle}</span>
        )}
      </header>

      {/* Range tabs — pill segmented control */}
      <div className="mt-3 inline-flex rounded-pill bg-primary-50/70 p-1 text-xs font-medium">
        {RANGE_OPTIONS.map((opt) => {
          const active = opt.value === range;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={cn(
                "h-7 rounded-pill px-3 transition-colors",
                active
                  ? "bg-brand-purple text-white shadow-[0_2px_8px_rgba(93,79,236,0.35)]"
                  : "text-ink-600 hover:text-brand-purple"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="mt-4">
        <VenomLineChart data={data} />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SVG line chart                                */
/* -------------------------------------------------------------------------- */

interface VenomLineChartProps {
  data: VenomDatum[];
}

function VenomLineChart({ data }: VenomLineChartProps) {
  // Static viewBox; the SVG itself scales fluidly to the container.
  const W = 720;
  const H = 240;
  const PAD_L = 36; // y-axis labels
  const PAD_R = 12;
  const PAD_T = 16;
  const PAD_B = 30;

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const { points, yTicks, line, area } = useMemo(() => {
    if (data.length === 0) {
      return {
        points: [] as { x: number; y: number; datum: VenomDatum }[],
        yTicks: [] as { y: number; label: string }[],
        line: "",
        area: "",
      };
    }

    const values = data.map((d) => d.value);
    const minV = Math.min(...values, 0);
    const maxV = Math.max(...values, minV + 1);
    // Round up to a nicer top so the line never touches the ceiling.
    const niceMax = Math.ceil(maxV / 20) * 20 || 20;
    const niceMin = Math.floor(minV / 20) * 20;
    const span = niceMax - niceMin || 1;

    const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;

    const pts = data.map((d, i) => {
      const x = PAD_L + i * xStep;
      const y = PAD_T + innerH * (1 - (d.value - niceMin) / span);
      return { x, y, datum: d };
    });

    // Smooth Catmull-Rom → Bézier conversion for a "rounded" line look.
    const path = pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        const prev = pts[i - 1];
        const cx1 = (prev.x + p.x) / 2;
        const cx2 = (prev.x + p.x) / 2;
        return `C ${cx1.toFixed(1)} ${prev.y.toFixed(1)}, ${cx2.toFixed(
          1
        )} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(" ");

    const areaPath =
      pts.length > 0
        ? `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${(
            PAD_T + innerH
          ).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD_T + innerH).toFixed(
            1
          )} Z`
        : "";

    // 4 horizontal grid ticks plus the top.
    const tickCount = 4;
    const ticks: { y: number; label: string }[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const v = niceMin + (span * i) / tickCount;
      const y = PAD_T + innerH * (1 - (v - niceMin) / span);
      ticks.push({ y, label: String(Math.round(v)) });
    }

    return { points: pts, yTicks: ticks, line: path, area: areaPath };
  }, [data, innerW, innerH]);

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-2xl bg-ink-50 text-sm text-ink-500">
        Aucune donnée pour cette période.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-[240px] w-full"
      role="img"
      aria-label="Courbe de production de venin"
    >
      <defs>
        <linearGradient id="venomFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E89441" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#E89441" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Horizontal grid + y-axis labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={t.y}
            y2={t.y}
            stroke="#E5E7EB"
            strokeWidth={1}
            strokeDasharray={i === yTicks.length - 1 ? "" : "0"}
          />
          <text
            x={PAD_L - 6}
            y={t.y + 3}
            textAnchor="end"
            fontSize={10}
            fill="#9CA3AF"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* Area + line */}
      <path d={area} fill="url(#venomFill)" />
      <path
        d={line}
        fill="none"
        stroke="#E89441"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* X-axis labels — every label fits when there's room, otherwise sparse */}
      {points.map((p, i) => {
        const showEvery = Math.max(1, Math.ceil(points.length / 12));
        if (i % showEvery !== 0 && i !== points.length - 1) return null;
        return (
          <text
            key={i}
            x={p.x}
            y={H - 10}
            textAnchor="middle"
            fontSize={10}
            fill="#9CA3AF"
          >
            {p.datum.label}
          </text>
        );
      })}
    </svg>
  );
}
