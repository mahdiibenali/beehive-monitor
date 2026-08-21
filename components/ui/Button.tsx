"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Figma kit: pill shape, Primary = orange, Secondary = purple, compact (~36px) */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium leading-none rounded-pill " +
  "transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 " +
  "disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-orange text-white " +
    "hover:bg-brand-orange-hover active:bg-brand-orange-pressed " +
    "disabled:bg-brand-orange-disabled disabled:text-brand-disabled-text",
  secondary:
    "bg-brand-purple text-white " +
    "hover:bg-brand-purple-hover active:bg-brand-purple-pressed " +
    "disabled:bg-brand-purple-disabled disabled:text-brand-disabled-text",
  ghost:
    "bg-transparent text-brand-purple " +
    "hover:bg-primary-50 active:bg-primary-100 disabled:text-ink-400",
  link:
    "bg-transparent text-brand-purple underline-offset-2 " +
    "hover:underline disabled:text-ink-400",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-[13px]",
  md: "h-9 px-5 text-sm",
  lg: "h-11 px-6 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    type = "button",
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {leftIcon && (
        <span className="-ml-0.5 flex shrink-0 items-center">{leftIcon}</span>
      )}
      {children}
      {rightIcon && (
        <span className="-mr-0.5 flex shrink-0 items-center">{rightIcon}</span>
      )}
    </button>
  );
});
