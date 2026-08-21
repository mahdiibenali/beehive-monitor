/**
 * Shared presence-window configuration.
 *
 * Clients ping POST /api/auth/heartbeat every `HEARTBEAT_INTERVAL_MS`
 * milliseconds. A user is considered **online** while
 * `lastActiveAt > now - PRESENCE_WINDOW_MS`. The window is set to a
 * couple of intervals so transient network blips don't flip the state.
 */
export const HEARTBEAT_INTERVAL_MS = 45_000; // 45s
export const PRESENCE_WINDOW_MS = 90_000; // 90s — ≈ 2 missed beats

/** Server-side: is the given timestamp within the presence window? */
export function isOnline(lastActiveAt: Date | string | null | undefined): boolean {
  if (!lastActiveAt) return false;
  const t =
    typeof lastActiveAt === "string"
      ? new Date(lastActiveAt).getTime()
      : lastActiveAt.getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= PRESENCE_WINDOW_MS;
}
