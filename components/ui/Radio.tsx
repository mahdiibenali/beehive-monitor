"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/cn";

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, id, className, disabled, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group inline-flex cursor-pointer items-center gap-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={inputId}
          type="radio"
          disabled={disabled}
          className="peer sr-only"
          {...rest}
        />
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full border border-ink-300 bg-white transition",
            "group-hover:border-brand-purple",
            "peer-checked:border-brand-purple peer-checked:[&>span]:scale-100"
          )}
        >
          <span className="h-2 w-2 scale-0 rounded-full bg-brand-purple transition-transform" />
        </span>
      </span>
      {label && <span className="text-sm text-ink-800">{label}</span>}
    </label>
  );
});
