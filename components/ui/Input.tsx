"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  hint?: string;
  containerClassName?: string;
}

/**
 * Figma kit — pill-shaped, slim text input.
 * • rounded-full / no shadow / flat
 * • light grey border (ink-200)
 * • focus = darker border, no ring/glow
 * • error = orange border + small alert text below
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    leftIcon,
    rightIcon,
    hint,
    id,
    className,
    containerClassName,
    disabled,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium text-ink-800",
            disabled && "text-ink-400"
          )}
        >
          {label}
        </label>
      )}

      <div
        className={cn(
          "group relative flex h-10 items-center rounded-full border bg-white px-4 transition-colors",
          "border-ink-200",
          "hover:border-ink-300",
          "focus-within:border-ink-400",
          error &&
            "border-brand-orange hover:border-brand-orange focus-within:border-brand-orange",
          disabled &&
            "cursor-not-allowed border-ink-200 bg-ink-50 opacity-70 hover:border-ink-200"
        )}
      >
        {leftIcon && (
          <span
            className={cn(
              "mr-2 flex h-4 w-4 shrink-0 items-center justify-center text-ink-400",
              error && "text-brand-orange"
            )}
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={cn(
            "w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed",
            className
          )}
          {...rest}
        />

        {rightIcon && (
          <span
            className={cn(
              "ml-2 flex h-4 w-4 shrink-0 items-center justify-center text-ink-400",
              error && "text-brand-orange"
            )}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <p className="ml-1 flex items-center gap-1 text-xs text-brand-orange">
          <AlertCircle className="h-3 w-3" strokeWidth={2} />
          {error}
        </p>
      ) : hint ? (
        <p className="ml-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});
