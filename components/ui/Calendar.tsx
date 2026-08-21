"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DAY_NAMES_FR,
  MONTH_NAMES_FR,
  getMonthGrid,
  isSameDay,
  isBetween,
  isBefore,
} from "@/lib/calendar";

interface CalendarProps {
  viewDate: Date;
  onChangeView: (date: Date) => void;

  mode?: "single" | "range";

  selected?: Date | null;
  onSelect?: (date: Date) => void;

  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  onSelectRange?: (start: Date | null, end: Date | null) => void;

  showNav?: boolean;
  className?: string;
}

export function Calendar({
  viewDate,
  onChangeView,
  mode = "single",
  selected,
  onSelect,
  rangeStart,
  rangeEnd,
  onSelectRange,
  showNav = true,
  className,
}: CalendarProps) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  function prevMonth() {
    onChangeView(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    onChangeView(new Date(year, month + 1, 1));
  }

  function handleClick(d: Date) {
    if (mode === "single") {
      onSelect?.(d);
      return;
    }
    if (!rangeStart || (rangeStart && rangeEnd)) {
      onSelectRange?.(d, null);
    } else if (isBefore(d, rangeStart)) {
      onSelectRange?.(d, rangeStart);
    } else if (isSameDay(d, rangeStart)) {
      onSelectRange?.(d, d);
    } else {
      onSelectRange?.(rangeStart, d);
    }
  }

  return (
    <div className={cn("w-full min-w-[280px] select-none", className)}>
      {/* Month nav */}
      {showNav && (
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple text-white transition-colors hover:bg-brand-purple-hover"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <span className="text-sm font-semibold text-ink-900">
            {MONTH_NAMES_FR[month]} {year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple text-white transition-colors hover:bg-brand-purple-hover"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Day name header */}
      <div className="grid grid-cols-7 text-center">
        {DAY_NAMES_FR.map((d) => (
          <span
            key={d}
            className="min-w-0 truncate pb-2 text-[11px] font-medium text-ink-400"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {grid.flat().map((cell, idx) => {
          const isSelectedSingle =
            mode === "single" && isSameDay(cell.date, selected ?? null);

          const isStart =
            mode === "range" && isSameDay(cell.date, rangeStart ?? null);
          const isEnd =
            mode === "range" && isSameDay(cell.date, rangeEnd ?? null);
          const isInRange =
            mode === "range" &&
            rangeStart &&
            rangeEnd &&
            isBetween(cell.date, rangeStart, rangeEnd);
          const hasFullRange = !!(rangeStart && rangeEnd);
          const sameStartEnd =
            hasFullRange && isSameDay(rangeStart!, rangeEnd!);

          let bgClass = "";
          if (mode === "range" && hasFullRange && !sameStartEnd) {
            if (isInRange) bgClass = "bg-accent-100";
            else if (isStart) {
              bgClass =
                "bg-gradient-to-r from-transparent from-50% to-accent-100 to-50%";
            } else if (isEnd) {
              bgClass =
                "bg-gradient-to-r from-accent-100 from-50% to-transparent to-50%";
            }
          }

          const isCircle = isSelectedSingle || isStart || isEnd;

          return (
            <div
              key={idx}
              className={cn("relative flex h-10 items-center justify-center", bgClass)}
            >
              <button
                type="button"
                onClick={() => handleClick(cell.date)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  !cell.inCurrentMonth && "text-ink-300",
                  cell.inCurrentMonth &&
                    !isCircle &&
                    "text-[#2D2B4E] hover:bg-ink-100",
                  isCircle &&
                    "bg-brand-orange text-white hover:bg-brand-orange-hover"
                )}
              >
                {cell.day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
