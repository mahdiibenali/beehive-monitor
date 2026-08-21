"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  ChangeEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Country {
  code: string; // ISO code, e.g. "IT"
  name: string;
  dial: string; // "+39"
  flag: string; // emoji
}

const DEFAULT_COUNTRIES: Country[] = [
  { code: "TN", name: "Tunisia", dial: "+216", flag: "🇹🇳" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
];

interface PhoneInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  country?: Country;
  onCountryChange?: (country: Country) => void;
  countries?: Country[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  label,
  value = "",
  onChange,
  country,
  onCountryChange,
  countries = DEFAULT_COUNTRIES,
  placeholder = "000 000 000",
  disabled,
  className,
}: PhoneInputProps) {
  const selected = country ?? countries[0];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popPos, setPopPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Anchor the portal to the trigger button and keep it aligned while
  // the user scrolls or resizes — otherwise an overflow:auto parent
  // (e.g. `ModalBody`) would clip the dropdown.
  useLayoutEffect(() => {
    if (!open) return;
    function reposition() {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setPopPos({ top: r.bottom + 6, left: r.left });
    }
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={wrapRef} className={cn("relative flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-sm font-medium text-ink-800">{label}</span>
      )}

      <div className="flex items-center gap-2">
        {/* Country picker */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-full border bg-white px-3 transition-colors",
            "border-ink-200 hover:border-ink-300",
            open && "border-ink-400",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-sm font-medium text-ink-800">{selected.dial}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-ink-500 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {/* Phone number input */}
        <div
          className={cn(
            "flex h-10 flex-1 items-center rounded-full border bg-white px-4 transition-colors",
            "border-ink-200 hover:border-ink-300 focus-within:border-ink-400",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <input
            type="tel"
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange?.(e.target.value)
            }
            className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
        </div>
      </div>

      {/* Country dropdown — portalled so it isn't clipped by an
          `overflow:auto` ancestor (e.g. ModalBody). Mouse events are
          stopped here so they don't bubble through the React tree to a
          parent Modal overlay (which would close the modal). */}
      {mounted && open && !disabled && popPos &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: popPos.top, left: popPos.left }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="z-[60] w-72 overflow-hidden rounded-[20px] border border-ink-200 bg-white shadow-pop"
          >
            <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2">
              <Search className="h-4 w-4 text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
              />
            </div>
            <ul className="max-h-60 overflow-auto p-1.5">
              {filtered.map((c) => {
                const isActive = c.code === selected.code;
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        onCountryChange?.(c);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-full px-3 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-brand-purple text-white"
                          : "text-ink-800 hover:bg-ink-50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base leading-none">{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      {isActive && <Check className="h-4 w-4" />}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-ink-400">No country</li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

export { DEFAULT_COUNTRIES };

/**
 * Split a stored phone string ("+216 12 345 678") into the matching
 * {@link Country} entry + the remaining national number ("12 345 678").
 * Falls back to the first country if no dial code is detected.
 */
export function splitPhone(
  full: string | undefined,
  countries: Country[] = DEFAULT_COUNTRIES
): { country: Country; number: string } {
  const fallback = countries[0];
  if (!full) return { country: fallback, number: "" };

  const trimmed = full.trim();
  if (!trimmed.startsWith("+")) {
    return { country: fallback, number: trimmed };
  }

  // Longest dial code first so "+1" doesn't shadow "+1-…" etc.
  const sorted = [...countries].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.dial)) {
      return { country: c, number: trimmed.slice(c.dial.length).trim() };
    }
  }
  return { country: fallback, number: trimmed };
}

/** Combine a country dial code with a national number, normalising spaces. */
export function joinPhone(country: Country, number: string): string {
  const n = number.trim();
  if (!n) return "";
  return `${country.dial} ${n}`;
}
