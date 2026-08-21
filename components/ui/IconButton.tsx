"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type IconButtonVariant = "primary" | "secondary" | "ghost" | "outline";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: "sm" | "md";
  label?: string;
}

const variants: Record<IconButtonVariant, string> = {
  primary:
    "bg-brand-orange text-white hover:bg-brand-orange-hover active:bg-brand-orange-pressed",
  secondary:
    "bg-brand-purple text-white hover:bg-brand-purple-hover active:bg-brand-purple-pressed",
  ghost: "text-ink-700 hover:bg-ink-100 active:bg-ink-200",
  outline:
    "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50 active:bg-ink-100",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, variant = "outline", size = "md", label, className, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center rounded-field transition",
          size === "sm" ? "h-9 w-9" : "h-10 w-10",
          variants[variant],
          className
        )}
        {...rest}
      >
        {icon}
      </button>
    );
  }
);
