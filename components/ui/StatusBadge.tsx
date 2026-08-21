"use client";

import { cn } from "@/lib/cn";

export type StatusVariant = "active" | "disabled" | "expired" | "suspended";

const styles: Record<StatusVariant, { bg: string; dot: string; text: string }> = {
  active: {
    bg: "bg-gradient-to-r from-[#D4CEF8] to-[#B0A6F0]",
    dot: "bg-brand-purple",
    text: "text-[#2D2570]",
  },
  disabled: {
    bg: "bg-accent-50",
    dot: "bg-brand-orange",
    text: "text-[#9B5A1F]",
  },
  expired: {
    bg: "bg-[#FFF1D9]",
    dot: "bg-[#E8B020]",
    text: "text-[#8C6D11]",
  },
  suspended: {
    bg: "bg-red-50",
    dot: "bg-red-500",
    text: "text-red-700",
  },
};

const labels: Record<StatusVariant, string> = {
  active: "Active",
  disabled: "Désactivé",
  expired: "Expiré",
  suspended: "Suspendu",
};

interface StatusBadgeProps {
  variant?: StatusVariant;
  children?: React.ReactNode;
  className?: string;
}

export function StatusBadge({
  variant = "active",
  children,
  className,
}: StatusBadgeProps) {
  const s = styles[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        s.bg,
        s.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} />
      {children ?? labels[variant]}
    </span>
  );
}
