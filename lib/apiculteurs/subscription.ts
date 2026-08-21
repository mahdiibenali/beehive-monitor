/**
 * Subscription lifecycle helpers for the apiculteur entity.
 *
 * One source of truth for:
 *   • adding months to a date with proper end-of-month clamping
 *   • computing the effective status from the persisted fields
 *   • computing the "X jours restants / depuis" labels used in the UI
 *
 * Server **and** client import these (no `server-only`).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Add `months` to `from` and clamp to the last day of the resulting
 * month when the source day doesn't exist there (e.g. Jan 31 + 1 month
 * → Feb 28/29).
 */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

/** Whole days between two instants (rounded, can be negative). */
export function daysBetween(a: Date | number, b: Date | number): number {
  const ms = (typeof a === "number" ? a : a.getTime()) -
    (typeof b === "number" ? b : b.getTime());
  return Math.round(ms / DAY_MS);
}

/** Whole days remaining from `now` until `endsAt` (negative = overdue). */
export function daysRemaining(
  endsAt: Date | string | null,
  now: Date = new Date()
): number | null {
  if (!endsAt) return null;
  const t = typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  return daysBetween(t, now);
}

export type StoredStatus = "active" | "expired" | "suspended";
export type EffectiveStatus = StoredStatus;

/**
 * Compute the "real" status shown in the UI from the persisted fields.
 * • suspended  → stays suspended until reactivated
 * • active     → flips to "expired" automatically once endsAt is past
 * • expired    → stays expired
 */
export function deriveStatus(args: {
  status: StoredStatus;
  endsAt: Date | string | null;
  now?: Date;
}): EffectiveStatus {
  const { status } = args;
  const now = args.now ?? new Date();
  if (status === "suspended") return "suspended";
  if (!args.endsAt) return status;
  const ends =
    typeof args.endsAt === "string" ? new Date(args.endsAt) : args.endsAt;
  if (ends.getTime() < now.getTime()) return "expired";
  return status;
}
