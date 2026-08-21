"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  /** Top-left label, e.g. "Apiculteur". */
  label: string;
  /** Big number displayed under the label. */
  value: number | string;
  /** Optional sub-text, e.g. "+14 ce mois". */
  trend?: {
    value: number;
    suffix: string;
  };
  /** Small icon shown top-right in a soft colored bubble. */
  icon: ReactNode;
  /**
   * Bubble color tone — defaults to "brand-purple". Use "brand-orange" for
   * warning-like cards.
   */
  tone?: "purple" | "orange";
  className?: string;
}

/**
 * Single KPI card used in the "Gestion d'abonnements" header row.
 * Matches the Figma: small label, big bold number, tiny trend, soft
 * tinted bubble icon top-right.
 */
export function StatCard({
  label,
  value,
  trend,
  icon,
  tone = "purple",
  className,
}: StatCardProps) {
  const trendSign = trend
    ? trend.value > 0
      ? "+"
      : trend.value < 0
      ? "-"
      : ""
    : "";
  const trendValue = trend ? Math.abs(trend.value).toString().padStart(2, "0") : "";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl bg-white p-4 shadow-card",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            tone === "purple"
              ? "bg-primary-100 text-brand-purple"
              : "bg-accent-50 text-brand-orange"
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink-900">
        {value}
      </p>
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            trend.value < 0 ? "text-brand-orange" : "text-ink-500"
          )}
        >
          {trendSign}
          {trendValue} {trend.suffix}
        </p>
      )}
    </div>
  );
}
