"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Chip } from "./Chip";

interface FilterBarProps {
  className?: string;
  children?: ReactNode;
}

export function FilterBar({ className, children }: FilterBarProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-ink-100 bg-white p-4 shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

interface FilterRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function FilterRow({ label, children, className }: FilterRowProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="w-16 text-xs font-medium text-ink-600">{label}</span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

interface FilterLabelsProps {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}

export function FilterLabels({ options, selected, onChange }: FilterLabelsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <Chip
          key={opt.value}
          selected={opt.value === selected}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Chip>
      ))}
    </div>
  );
}
