"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, selected, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-pill px-3 py-1 text-xs font-medium transition",
        selected
          ? "bg-primary-500 text-white"
          : "bg-primary-50 text-primary-700 hover:bg-primary-100",
        className
      )}
    >
      {children}
    </button>
  );
}
