/** Calendar helpers — Monday-first, French locale */

export const DAY_NAMES_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const MONTH_NAMES_FR = [
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

export interface MonthCell {
  date: Date;
  day: number;
  inCurrentMonth: boolean;
}

/** Returns 6 rows × 7 days for a month grid, Monday-first. */
export function getMonthGrid(year: number, month: number): MonthCell[][] {
  const firstOfMonth = new Date(year, month, 1);
  // weekday: 0 = Sunday → convert to Monday-first (0 = Monday … 6 = Sunday)
  const weekdayMondayFirst = (firstOfMonth.getDay() + 6) % 7;

  // Start at the Monday on or before the 1st
  const start = new Date(year, month, 1 - weekdayMondayFirst);

  const rows: MonthCell[][] = [];
  const cursor = new Date(start);

  for (let r = 0; r < 6; r++) {
    const row: MonthCell[] = [];
    for (let c = 0; c < 7; c++) {
      row.push({
        date: new Date(cursor),
        day: cursor.getDate(),
        inCurrentMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(row);
  }
  return rows;
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBefore(a: Date, b: Date) {
  return a.getTime() < b.getTime();
}

export function isBetween(d: Date, start: Date, end: Date) {
  return d.getTime() > start.getTime() && d.getTime() < end.getTime();
}

export function formatFR(d: Date | null | undefined) {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** "14:35" — 24h French clock without seconds. */
export function formatTimeFR(d: Date | null | undefined) {
  if (!d) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** "30/04/2026 à 14:35" — date + time in one go. */
export function formatDateTimeFR(d: Date | null | undefined) {
  if (!d) return "";
  return `${formatFR(d)} à ${formatTimeFR(d)}`;
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
