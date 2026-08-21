"use client";

import { cn } from "@/lib/cn";

export interface DonutSlice {
  label: string;
  value: number;
  /** CSS color (hex / tailwind var / rgb…). */
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  /** Outer diameter in px. */
  size?: number;
  /** Stroke width = (size - innerSize) / 2 */
  thickness?: number;
  /** Optional content rendered in the center (e.g. total). */
  centerLabel?: React.ReactNode;
  className?: string;
  /** Show a legend with colored dots below the donut. */
  showLegend?: boolean;
}

/**
 * Lightweight SVG donut chart — zero deps.
 * Each slice is a stroked circle with `stroke-dasharray` math.
 */
export function DonutChart({
  data,
  size = 160,
  thickness = 22,
  centerLabel,
  className,
  showLegend = true,
}: DonutChartProps) {
  const total = data.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((slice, i) => {
    const length = (slice.value / total) * circumference;
    const seg = {
      key: `${slice.label}-${i}`,
      color: slice.color,
      dashArray: `${length} ${circumference - length}`,
      dashOffset: -offset,
    };
    offset += length;
    return seg;
  });

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          // -90deg rotation so slices start at 12 o'clock.
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={thickness}
          />
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {centerLabel && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
            {centerLabel}
          </div>
        )}
      </div>

      {showLegend && (
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {data.map((slice) => (
            <li
              key={slice.label}
              className="inline-flex items-center gap-1.5 text-xs text-ink-600"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: slice.color }}
              />
              {slice.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
