"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SelectCardProps {
  icon: ReactNode;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SelectCard({
  icon,
  label,
  selected,
  disabled,
  onClick,
  className,
}: SelectCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-card border-2 bg-white p-3 transition",
        selected
          ? "border-primary-500 text-primary-600 shadow-field"
          : "border-ink-200 text-ink-400 hover:border-ink-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center",
          selected ? "text-primary-500" : "text-ink-400"
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "text-sm font-medium",
          selected ? "text-primary-600" : "text-ink-500"
        )}
      >
        {label}
      </span>
    </button>
  );
}
