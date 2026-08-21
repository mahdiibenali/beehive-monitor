"use client";

import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { ScheduledSession } from "./rucheMockData";

interface PlanificationSectionProps {
  sessions: ScheduledSession[];
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

/**
 * Planification du collecteur — tab toggle (Planifié / Manuel) + month
 * calendar grid + start/end pickers + sessions list.
 */
export function PlanificationSection({ sessions }: PlanificationSectionProps) {
  const [mode, setMode] = useState<"planifie" | "manuel">("planifie");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [start, setStart] = useState("08:40");
  const [end, setEnd] = useState("08:40");

  const days = useMemo(() => buildMonth(cursor), [cursor]);

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-4">
      <header className="mb-3 flex items-center justify-center">
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          PLANIFICATION DU COLLECTEUR
        </h4>
      </header>

      {/* Mode toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-ink-50 p-1.5">
        <ToggleButton
          active={mode === "planifie"}
          onClick={() => setMode("planifie")}
          icon={<CalendarIcon className="h-4 w-4" />}
          label="Planifié"
        />
        <ToggleButton
          active={mode === "manuel"}
          onClick={() => setMode("manuel")}
          icon={<Settings2 className="h-4 w-4" />}
          label="Manuel"
        />
      </div>

      {mode === "planifie" ? (
        <>
          {/* Calendar header */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))
              }
              className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 text-brand-purple hover:bg-primary-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-ink-900">
              {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() =>
                setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))
              }
              className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 text-brand-purple hover:bg-primary-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-500">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="mb-4 grid grid-cols-7 gap-1">
            {days.map((d, i) => (
              <DayCell
                key={i}
                day={d}
                selected={selectedDay === d.day && d.currentMonth}
                onClick={() => d.currentMonth && setSelectedDay(d.day)}
              />
            ))}
          </div>

          {/* Start / End */}
          <div className="space-y-2">
            <TimeField label="Début" value={start} onChange={setStart} />
            <TimeField label="Fin" value={end} onChange={setEnd} />
          </div>

          {/* Add session button */}
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-pill bg-primary-100 px-4 py-2.5 text-sm font-medium text-brand-purple transition-colors hover:bg-primary-200"
          >
            <Plus className="h-4 w-4" />
            Ajouter une session
          </button>

          {/* Scheduled sessions */}
          {sessions.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-ink-500">
                session planifié
              </p>
              {sessions.map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-100 bg-ink-50/40 px-4 py-8 text-center text-sm text-ink-500">
          Mode manuel — déclenchez une collecte ponctuelle depuis le terrain.
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                */
/* -------------------------------------------------------------------------- */

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-white text-brand-purple shadow-sm ring-1 ring-primary-200"
          : "text-ink-500 hover:bg-white/60"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface CalendarDay {
  day: number;
  currentMonth: boolean;
  /** Decoration applied by mock data (highlight / accent / muted). */
  highlight?: "purple" | "orange" | "current";
}

function DayCell({
  day,
  selected,
  onClick,
}: {
  day: CalendarDay;
  selected: boolean;
  onClick: () => void;
}) {
  let cls = "text-ink-700 hover:bg-ink-50";
  if (!day.currentMonth) cls = "text-ink-300";
  if (day.highlight === "purple") cls = "text-brand-purple font-semibold";
  if (day.highlight === "orange") cls = "text-brand-orange font-semibold";
  if (day.highlight === "current") {
    cls = "bg-brand-purple text-white font-semibold";
  }
  if (selected && day.currentMonth) {
    cls = "bg-brand-orange text-white font-semibold";
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center rounded-full text-sm transition-colors",
        cls
      )}
      disabled={!day.currentMonth}
    >
      {day.day}
    </button>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-primary-100 px-4 py-2.5">
      <span className="w-12 text-sm text-brand-purple">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ml-auto rounded-md border border-transparent bg-white px-3 py-1.5 text-sm font-medium text-ink-900 focus:border-brand-purple focus:outline-none"
      />
    </div>
  );
}

function SessionRow({ session }: { session: ScheduledSession }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white px-3 py-2 text-sm text-ink-700">
      <div className="flex items-center gap-3">
        <CalendarIcon className="h-4 w-4 text-brand-purple" />
        <span>{session.dayLabel}</span>
        <span className="text-ink-400">|</span>
        <span>{session.start}</span>
      </div>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-ink-50"
        aria-label="Options"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Calendar helpers                              */
/* -------------------------------------------------------------------------- */

function buildMonth(cursor: Date): CalendarDay[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  // JS: 0=Sun..6=Sat. We want Lun first → shift.
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const cells: CalendarDay[] = [];

  // Leading blanks from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthLastDay - i,
      currentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    let highlight: CalendarDay["highlight"];
    if (isCurrentMonth && d === today.getDate()) highlight = "current";
    // Add a couple of accent days to match the mockup feel.
    else if (d === 9) highlight = "purple";
    else if (d === 23) highlight = "purple";
    else if (d === 16) highlight = "purple";
    else if (d === 24) highlight = "orange";
    cells.push({ day: d, currentMonth: true, highlight });
  }

  // Trailing blanks to fill the grid (6 rows = 42 cells).
  while (cells.length % 7 !== 0) {
    cells.push({
      day: cells.length - lastOfMonth.getDate() - firstWeekday + 1,
      currentMonth: false,
    });
  }

  return cells;
}
