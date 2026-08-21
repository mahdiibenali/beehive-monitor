"use client";

import { cn } from "@/lib/cn";

/** Color the active pill (and the container tint) can take. */
export type PillTone = "purple" | "orange" | "red" | "green" | "yellow" | "ink";

export interface PillOption {
  value: string;
  label: string;
  /**
   * Optional accent color used **when this option is selected**.
   * Defaults to `purple` (the kit's primary look) when omitted.
   *
   * Used by the segmented variant to animate between, e.g., a purple
   * "Active", an orange "Expiré" and a red "Suspendu".
   */
  tone?: PillTone;
}

export type SelectPillVariant = "default" | "segmented";

interface SelectPillProps {
  label?: string;
  options: PillOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /**
   * • `default`   — separate purple pills with gaps (kit / style-guide look).
   * • `segmented` — one capsule with the active option highlighted as an
   *                 inset pill. When options declare a `tone`, both the
   *                 capsule background and the active pill color follow it.
   */
  variant?: SelectPillVariant;
}

/** Styles applied to the **active** pill, per tone. */
const ACTIVE_TONE: Record<PillTone, string> = {
  purple:
    "bg-brand-purple-hover text-white shadow-[0_2px_10px_rgba(120,77,255,0.35)]",
  orange:
    "bg-brand-orange text-white shadow-[0_2px_10px_rgba(232,148,65,0.4)]",
  red: "bg-danger text-white shadow-[0_2px_10px_rgba(239,68,68,0.35)]",
  green:
    "bg-success text-white shadow-[0_2px_10px_rgba(16,185,129,0.35)]",
  yellow:
    "bg-warning text-white shadow-[0_2px_10px_rgba(243,156,18,0.4)]",
  ink: "bg-ink-700 text-white",
};

/** Container (capsule) background tint based on the active option's tone. */
const CONTAINER_TONE: Record<PillTone, string> = {
  purple: "bg-primary-50",
  orange: "bg-accent-50",
  red: "bg-[#FEE4E4]",
  green: "bg-[#E4F8F0]",
  yellow: "bg-accent-50",
  ink: "bg-ink-100",
};

/** Hover hint color of **inactive** pills, per tone. */
const HOVER_TONE: Record<PillTone, string> = {
  purple: "hover:text-brand-purple",
  orange: "hover:text-brand-orange",
  red: "hover:text-danger",
  green: "hover:text-success",
  yellow: "hover:text-warning",
  ink: "hover:text-ink-800",
};

export function SelectPill({
  label,
  options,
  value,
  onChange,
  disabled,
  className,
  variant = "default",
}: SelectPillProps) {
  // Tone driving the *whole* segmented capsule comes from the active option
  // (falling back to purple to preserve the original look).
  const activeOption = options.find((o) => o.value === value);
  const containerTone: PillTone = activeOption?.tone ?? "purple";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-sm font-medium text-ink-800">{label}</span>
      )}

      {variant === "segmented" ? (
        <div
          role="tablist"
          className={cn(
            "inline-flex items-center gap-1 rounded-pill p-1 transition-colors duration-300",
            CONTAINER_TONE[containerTone],
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {options.map((opt) => {
            const active = value === opt.value;
            const tone: PillTone = opt.tone ?? "purple";
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={disabled}
                onClick={() => onChange?.(opt.value)}
                className={cn(
                  "rounded-pill px-4 py-1 text-sm font-medium transition-all duration-300 ease-out",
                  active
                    ? ACTIVE_TONE[tone]
                    : cn("bg-transparent text-ink-500", HOVER_TONE[tone]),
                  disabled && "cursor-not-allowed"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {options.map((opt) => {
            const active = value === opt.value;
            const tone: PillTone = opt.tone ?? "purple";
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange?.(opt.value)}
                className={cn(
                  "rounded-pill px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-out",
                  active
                    ? ACTIVE_TONE[tone]
                    : "bg-primary-50 text-primary-700 hover:bg-primary-100",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
