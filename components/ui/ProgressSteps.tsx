"use client";

import { cn } from "@/lib/cn";

export type StepState = "disabled" | "done" | "selected";

interface ProgressDotProps {
  state?: StepState;
  className?: string;
}

/** Single step dot — disabled | done | selected (larger) */
export function ProgressDot({ state = "disabled", className }: ProgressDotProps) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full transition-all",
        state === "disabled" && "h-2 w-2 bg-ink-200",
        state === "done" && "h-2 w-2 bg-brand-purple",
        state === "selected" && "h-3 w-3 bg-brand-purple",
        className
      )}
      aria-hidden
    />
  );
}

interface ProgressStepsProps {
  /** Number of steps */
  total: number;
  /** Current active step (0-based) */
  current: number;
  /** Visual style */
  variant?: "dots" | "labeled";
  className?: string;
}

/** Horizontal progress — simple gray dots or purple done/selected */
export function ProgressSteps({
  total,
  current,
  variant = "dots",
  className,
}: ProgressStepsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} role="list">
      {Array.from({ length: total }).map((_, i) => {
        let state: StepState = "disabled";
        if (i < current) state = "done";
        else if (i === current) state = "selected";

        if (variant === "dots" && state === "disabled") {
          return <ProgressDot key={i} state="disabled" />;
        }
        return <ProgressDot key={i} state={state} />;
      })}
    </div>
  );
}

/** Showcase row matching Figma: Disabled / Done / Selected labels */
export function ProgressStepsLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-8", className)}>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium text-ink-600">Disabled</span>
        <ProgressDot state="disabled" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium text-ink-600">Done</span>
        <ProgressDot state="done" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium text-ink-600">Selected</span>
        <ProgressDot state="selected" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium text-ink-600">Simple</span>
        <ProgressSteps total={3} current={-1} />
      </div>
    </div>
  );
}
