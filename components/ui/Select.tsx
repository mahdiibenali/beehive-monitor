"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  ReactNode,
  KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface BaseProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  error?: string;
  className?: string;
  leftIcon?: ReactNode;
}

interface SingleSelectProps extends BaseProps {
  multiple?: false;
  value?: string;
  onChange?: (value: string) => void;
}

interface MultiSelectProps extends BaseProps {
  multiple: true;
  value?: string[];
  onChange?: (value: string[]) => void;
}

export type SelectProps = SingleSelectProps | MultiSelectProps;

/**
 * Figma kit — pill-shaped select / dropdown / multiselect.
 *
 * The menu is rendered through a React portal anchored to the trigger
 * button, so it isn't clipped by an `overflow:auto` ancestor (e.g.
 * `ModalBody`) and mouse events are stopped before they reach the parent
 * Modal overlay (which would otherwise close the modal on selection).
 */
export function Select(props: SelectProps) {
  const {
    label,
    placeholder = "Dropdown Placeholder",
    options,
    disabled,
    error,
    className,
    leftIcon,
  } = props;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLUListElement>(null);
  const [popPos, setPopPos] = useState<
    { top: number; left: number; width: number } | null
  >(null);
  const autoId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close when the user clicks outside both the trigger and the portalled menu.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Keep the portal aligned with the trigger while scrolling / resizing.
  useLayoutEffect(() => {
    if (!open) return;
    function reposition() {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) {
        setPopPos({
          top: r.bottom + 6,
          left: r.left,
          width: r.width,
        });
      }
    }
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const isMulti = props.multiple === true;
  const selectedValues = isMulti
    ? (props.value ?? [])
    : props.value
      ? [props.value]
      : [];

  function pick(opt: SelectOption) {
    if (isMulti) {
      const set = new Set(selectedValues);
      if (set.has(opt.value)) set.delete(opt.value);
      else set.add(opt.value);
      (props as MultiSelectProps).onChange?.(Array.from(set));
    } else {
      (props as SingleSelectProps).onChange?.(opt.value);
      setOpen(false);
    }
  }

  function handleKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((o) => !o);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const display = (() => {
    if (selectedValues.length === 0) return null;
    if (isMulti) {
      return selectedValues.length > 1
        ? "..."
        : options.find((o) => o.value === selectedValues[0])?.label;
    }
    return options.find((o) => o.value === selectedValues[0])?.label;
  })();

  return (
    <div
      ref={wrapRef}
      className={cn("relative flex w-full flex-col gap-1.5", className)}
    >
      {label && (
        <label
          htmlFor={autoId}
          className={cn(
            "text-sm font-medium text-ink-800",
            disabled && "text-ink-400"
          )}
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        id={autoId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-full border bg-white px-4 text-left text-sm transition-colors",
          "border-ink-200 hover:border-ink-300",
          open && "border-ink-400",
          error && "border-brand-orange",
          disabled && "cursor-not-allowed bg-ink-50 opacity-70"
        )}
      >
        {leftIcon && (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-ink-400">
            {leftIcon}
          </span>
        )}
        <span
          className={cn(
            "flex-1 truncate",
            display ? "text-ink-900" : "text-ink-400"
          )}
        >
          {display ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-500 transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>

      {/* Dropdown — portalled so it isn't clipped by an `overflow:auto`
          ancestor, and so option clicks don't bubble to a parent Modal
          overlay (which would close the modal). */}
      {mounted && open && !disabled && popPos &&
        createPortal(
          <ul
            ref={popoverRef}
            role="listbox"
            style={{
              position: "fixed",
              top: popPos.top,
              left: popPos.left,
              width: popPos.width,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="z-[60] max-h-60 overflow-auto rounded-[20px] border border-ink-200 bg-white p-1.5 shadow-pop"
          >
            {options.map((opt) => {
              const selected = selectedValues.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pick(opt)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "bg-primary-50 text-ink-900"
                        : "text-ink-800 hover:bg-ink-50"
                    )}
                  >
                    {selected ? (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 text-ink-900"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              );
            })}
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-400">No options</li>
            )}
          </ul>,
          document.body
        )}

      {error && <p className="ml-1 text-xs text-brand-orange">{error}</p>}
    </div>
  );
}
