"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Calendar } from "./Calendar";
import { addMonths, formatFR } from "@/lib/calendar";

export type DateFilterType = "est" | "est-entre" | "avant" | "apres";

const FILTER_OPTIONS: { value: DateFilterType; label: string }[] = [
  { value: "est", label: "Est" },
  { value: "est-entre", label: "Est entre" },
  { value: "avant", label: "Avant le" },
  { value: "apres", label: "Après le" },
];

interface DatePickerProps {
  label?: string;
  filterType?: DateFilterType;
  onChangeFilterType?: (v: DateFilterType) => void;

  date?: Date | null;
  onChangeDate?: (d: Date | null) => void;

  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  onChangeRange?: (start: Date | null, end: Date | null) => void;

  onClear?: () => void;
  className?: string;
  alwaysOpen?: boolean;
}

export function DatePicker({
  label = "Date",
  filterType = "est",
  onChangeFilterType,
  date,
  onChangeDate,
  rangeStart,
  rangeEnd,
  onChangeRange,
  onClear,
  className,
  alwaysOpen = true,
}: DatePickerProps) {
  const isRange = filterType === "est-entre";
  const [viewLeft, setViewLeft] = useState<Date>(
    date ?? rangeStart ?? new Date()
  );
  const viewRight = addMonths(viewLeft, 1);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function close(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const activeFilter = FILTER_OPTIONS.find((o) => o.value === filterType)!;

  return (
    <div
      className={cn(
        "rounded-[24px] border border-ink-100 bg-white p-5 shadow-card",
        isRange ? "w-[640px]" : "w-[320px]",
        className
      )}
    >
      {/* Header: Date label + filter chip + trash */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-semibold text-ink-900">{label}</span>

        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className="flex h-7 items-center gap-1.5 rounded-full bg-primary-50 px-3 text-xs font-medium text-brand-purple transition-colors hover:bg-primary-100"
          >
            {activeFilter.label}
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                filterOpen && "rotate-180"
              )}
              strokeWidth={2.5}
            />
          </button>
          {filterOpen && (
            <ul className="absolute left-0 top-full z-20 mt-1.5 w-32 overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-pop">
              {FILTER_OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeFilterType?.(opt.value);
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "block w-full rounded-full px-3 py-1.5 text-left text-xs font-medium transition-colors",
                      opt.value === filterType
                        ? "bg-primary-50 text-brand-purple"
                        : "text-ink-800 hover:bg-ink-50"
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onClear}
          aria-label="Clear date"
          className="flex h-7 w-7 items-center justify-center rounded-full text-brand-orange transition-colors hover:bg-accent-100"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Inputs (pill, light purple border) */}
      <div className={cn("mb-4 grid gap-2", isRange ? "grid-cols-2" : "grid-cols-1")}>
        <DateInputBox value={formatFR(isRange ? rangeStart : date)} />
        {isRange && <DateInputBox value={formatFR(rangeEnd)} />}
      </div>

      {/* Calendar(s) */}
      {alwaysOpen && (
        <div className={cn("grid gap-6", isRange ? "grid-cols-2" : "grid-cols-1")}>
          <Calendar
            viewDate={viewLeft}
            onChangeView={setViewLeft}
            mode={isRange ? "range" : "single"}
            selected={isRange ? undefined : date}
            onSelect={onChangeDate}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onSelectRange={onChangeRange}
          />
          {isRange && (
            <Calendar
              viewDate={viewRight}
              onChangeView={(d) => setViewLeft(addMonths(d, -1))}
              mode="range"
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onSelectRange={onChangeRange}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DateInputBox({ value }: { value: string }) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-full border border-primary-100 bg-white px-4 text-sm text-ink-800">
      <span className={cn("flex-1 truncate", !value && "text-ink-400")}>
        {value || "JJ/MM/AAAA"}
      </span>
      <CalendarIcon className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.75} />
    </div>
  );
}
