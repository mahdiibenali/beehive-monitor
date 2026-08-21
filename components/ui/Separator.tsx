"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SeparatorProps {
  children?: ReactNode;
  className?: string;
}

export function Separator({ children, className }: SeparatorProps) {
  if (!children) {
    return (
      <hr className={cn("h-px w-full border-0 bg-ink-200", className)} />
    );
  }

  return (
    <div className={cn("flex w-full items-center gap-3", className)}>
      <div className="h-px flex-1 bg-ink-200" />
      <span className="text-xs text-ink-500">{children}</span>
      <div className="h-px flex-1 bg-ink-200" />
    </div>
  );
}
