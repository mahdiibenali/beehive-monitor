"use client";

import { ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type AlertVariant = "success" | "error" | "warning" | "info";

const variantStyles: Record<AlertVariant, string> = {
  success: "bg-[#8478D3]",
  error: "bg-[#E76E5C]",
  warning: "bg-[#F0A14B]",
  info: "bg-[#7B6CE7]",
};

const variantIcons: Record<AlertVariant, typeof CircleCheck> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: CircleAlert,
};

interface AlertProps {
  variant?: AlertVariant;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: string;
  onClose?: () => void;
  /** Action buttons shown in the extended layout */
  actions?: ReactNode;
  /** Compact pill style — icon + title + close only */
  compact?: boolean;
  className?: string;
}

export function Alert({
  variant = "info",
  title,
  description,
  timestamp,
  onClose,
  actions,
  compact = false,
  className,
}: AlertProps) {
  const Icon = variantIcons[variant];

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-white shadow-card",
          variantStyles[variant],
          className
        )}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="text-sm font-medium">{title}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-md items-start gap-3 rounded-2xl p-3 text-white shadow-card",
        variantStyles[variant],
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold leading-tight">{title}</span>
          {timestamp && (
            <>
              <span className="text-white/50">|</span>
              <span className="text-xs font-medium text-white/90">{timestamp}</span>
            </>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs leading-snug text-white/90">{description}</p>
        )}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Pre-styled small white action button used inside Alerts. */
interface AlertActionProps {
  children: ReactNode;
  onClick?: () => void;
  filled?: boolean;
}

export function AlertAction({ children, onClick, filled }: AlertActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition-colors",
        filled
          ? "bg-white text-ink-900 hover:bg-white/90"
          : "border border-white/70 text-white hover:bg-white/15"
      )}
    >
      {children}
    </button>
  );
}
