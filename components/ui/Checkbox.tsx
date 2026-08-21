"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, id, className, disabled, ...rest }, ref) {
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
            type="checkbox"
            disabled={disabled}
            className="peer sr-only"
            {...rest}
          />
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-[5px] border border-ink-300 bg-white transition",
              "group-hover:border-brand-purple",
              "peer-checked:border-brand-purple peer-checked:bg-brand-purple"
            )}
          >
            <Check
              className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
              strokeWidth={3}
            />
          </span>
        </span>
        {label && <span className="text-sm text-ink-800">{label}</span>}
      </label>
    );
  }
);
