"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  description: string;
  value: ReactNode;
  note?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({
  description,
  value,
  note,
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex w-44 flex-col gap-1 rounded-card border border-ink-200 bg-white p-4 shadow-card",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-ink-500">{description}</span>
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary-50 text-primary-500">
            {icon}
          </span>
        )}
      </div>
      <span className="text-h2 font-semibold text-ink-900">{value}</span>
      {note && (
        <span className="text-sm font-medium text-brand-orange">{note}</span>
      )}
    </div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-ink-200 bg-white p-5 shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}
