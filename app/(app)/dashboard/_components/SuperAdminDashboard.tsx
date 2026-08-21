"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Layers, Settings } from "lucide-react";
import { DonutChart } from "@/components/ui/DonutChart";
import { HBarChart } from "@/components/ui/HBarChart";
import { MetricCard } from "./MetricCard";
import { RegionList, type RegionRow } from "./RegionList";
import { AdminsConnectedCard } from "./AdminsConnectedCard";
import {
  MaintenanceCard,
  type MaintenanceRow,
} from "./MaintenanceCard";
import { formatFR, formatTimeFR } from "@/lib/calendar";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

interface DashboardStats {
  generatedAt: string;
  apiculteurs: { total: number; newThisMonth: number };
  ruches: { total: number; newThisMonth: number };
  maintenance: { total: number };
  byRegion: { region: string; count: number }[];
  byGender: { male: number; female: number; unknown: number };
  recentMaintenance: {
    id: string;
    title: string;
    status: "traite" | "non-traite";
    createdAt: string;
    startedAt: string | null;
    dueAt: string | null;
    apiculteur: { name: string; email: string; avatarSrc: string };
  }[];
  connectedAdmins: {
    id: string;
    name: string;
    email: string;
    avatarSrc: string;
    role: string;
    lastLoginAt: string | null;
    lastActiveAt: string | null;
    isOnline: boolean;
  }[];
  onlineAdminsCount: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/** Two-letter initials, e.g. "Yasmine Ben Ali" → "YB". */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** Build the "+X ce mois" / "—" delta string with a sensible sign. */
function deltaLabel(n: number) {
  if (n === 0) return "Aucun ce mois";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n} ce mois`;
}

/** "09/06/2026 - 10:20" using existing French calendar helpers. */
function formatConnectedAt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${formatFR(d)} - ${formatTimeFR(d)}`;
}

/**
 * Human-readable "il y a …" label for an offline timestamp.
 * Falls back to a French date when the gap is more than a day.
 */
function formatLastSeen(iso: string | null): string {
  if (!iso) return "Jamais";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "Il y a quelques secondes";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Il y a ${diffHr} h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `Il y a ${diffDay} j`;
  return formatFR(new Date(iso));
}

/**
 * Donut colors for the regions chart — cycles through the brand palette
 * so the slices stay visually distinct. Falls back to a muted grey for
 * any extra region beyond the palette.
 */
const REGION_COLORS = [
  "#5D4FEC",
  "#E89441",
  "#2B2353",
  "#FFB85C",
  "#373368",
  "#9CA3AF",
];

/* -------------------------------------------------------------------------- */
/*                              SuperAdminDashboard                           */
/* -------------------------------------------------------------------------- */

interface SuperAdminDashboardProps {
  /**
   * Which audience this dashboard is rendered for:
   *   • `super-admin` — full layout (default).
   *   • `admin`       — hides the "Admins connectés" presence card.
   * The API also drops the admins block for non-super-admins so the
   * client doesn't get the data over the wire either.
   */
  audience?: "super-admin" | "admin";
}

export function SuperAdminDashboard({
  audience = "super-admin",
}: SuperAdminDashboardProps = {}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled && !stats) {
            setError("Impossible de charger les statistiques.");
          }
          return;
        }
        const data = (await res.json()) as DashboardStats;
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled && !stats) {
          setError("Impossible de charger les statistiques.");
        }
      }
    }

    fetchStats();
    // Re-fetch every 30s so presence (Connecté / Hors ligne) stays fresh
    // without needing a manual reload. Cheap call, no client cache.
    const id = window.setInterval(fetchStats, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------
  // Derived view-models. Memoized so the children's identity stays stable
  // between re-renders triggered by parent state (theme, route, etc.).
  // ---------------------------------------------------------------------

  const regions = useMemo<RegionRow[]>(
    () =>
      (stats?.byRegion ?? []).map((r) => ({ name: r.region, value: r.count })),
    [stats]
  );

  const regionDonut = useMemo(() => {
    if (!stats) return [];
    const top = stats.byRegion.slice(0, 5);
    const rest = stats.byRegion.slice(5).reduce((s, r) => s + r.count, 0);
    const slices = top.map((r, idx) => ({
      label: r.region,
      value: r.count,
      color: REGION_COLORS[idx % REGION_COLORS.length],
    }));
    if (rest > 0) {
      slices.push({
        label: "Autres",
        value: rest,
        color: REGION_COLORS[5],
      });
    }
    return slices;
  }, [stats]);

  // HBarChart expects values as 0–100 percentages — convert the raw
  // counts here so the bars stay proportional regardless of headcount.
  const genderData = useMemo(() => {
    if (!stats) return [];
    const total =
      stats.byGender.male + stats.byGender.female + stats.byGender.unknown;
    const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
    return [
      { label: "Homme", value: pct(stats.byGender.male), color: "#5D4FEC" },
      { label: "Femme", value: pct(stats.byGender.female), color: "#EC4899" },
    ];
  }, [stats]);

  const connectedAdmins = useMemo(
    () =>
      (stats?.connectedAdmins ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        initials: initialsOf(a.name),
        connectedAt: formatConnectedAt(a.lastLoginAt),
        avatarSrc: a.avatarSrc,
        isOnline: a.isOnline,
        lastSeenLabel: formatLastSeen(a.lastActiveAt ?? a.lastLoginAt),
      })),
    [stats]
  );

  const recentMaintenance = useMemo<MaintenanceRow[]>(
    () =>
      (stats?.recentMaintenance ?? []).map((m) => ({
        id: m.id,
        name: m.apiculteur.name,
        email: m.apiculteur.email,
        initials: initialsOf(m.apiculteur.name),
        dateRange: formatFR(new Date(m.createdAt)),
        title: m.title,
        status: m.status,
        avatarSrc: m.apiculteur.avatarSrc,
      })),
    [stats]
  );

  const apiculteurTotal = stats?.apiculteurs.total ?? 0;
  const apiculteurDelta = stats ? deltaLabel(stats.apiculteurs.newThisMonth) : "";
  const rucheTotal = stats?.ruches.total ?? 0;
  const rucheDelta = stats ? deltaLabel(stats.ruches.newThisMonth) : "";
  const maintenanceTotal = stats?.maintenance.total ?? 0;

  if (error) {
    return (
      <div className="rounded-[18px] bg-white p-6 text-sm text-brand-orange shadow-card">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top metrics */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <MetricCard
          label="Apiculteur"
          value={stats ? apiculteurTotal.toLocaleString("fr-FR") : "—"}
          delta={apiculteurDelta || undefined}
          icon={<Users className="h-4 w-4" strokeWidth={2} />}
        />
        <MetricCard
          label="Ruches Totales"
          value={stats ? rucheTotal.toLocaleString("fr-FR") : "—"}
          delta={rucheDelta || undefined}
          icon={<Layers className="h-4 w-4" strokeWidth={2} />}
        />
        <MetricCard
          label="Demande de maintenance"
          value={stats ? maintenanceTotal.toLocaleString("fr-FR") : "—"}
          icon={<Settings className="h-4 w-4" strokeWidth={2} />}
        />
      </div>

      {/* Admins connectés — super-admin only */}
      {audience === "super-admin" && (
        <AdminsConnectedCard
          admins={connectedAdmins}
          onlineCount={stats?.onlineAdminsCount}
          emptyState={
            stats
              ? "Aucune connexion enregistrée pour le moment."
              : "Chargement…"
          }
        />
      )}

      {/* Region list + repartition charts.
          The whole row is anchored to a reasonable max-height. The left
          card scrolls internally, the right column's two cards split the
          matched height 1:1 so everything lines up flush at the bottom. */}
      <div className="grid grid-cols-1 items-stretch gap-5 xl:h-[560px] xl:grid-cols-[1.4fr_1fr]">
        <section className="flex min-h-0 flex-col rounded-[18px] bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">
              Utilisateurs par région
            </h2>
            <span className="text-xs text-ink-400">Apiculteurs</span>
          </div>
          {!stats ? (
            <p className="flex-1 py-6 text-center text-sm text-ink-500">
              Chargement…
            </p>
          ) : (
            <RegionList data={regions} />
          )}
        </section>

        <div className="flex min-h-0 flex-col gap-5">
          {/* Donut — vertically centered in its share of the column. */}
          <section className="flex min-h-0 flex-1 flex-col rounded-[18px] bg-white p-5 shadow-card">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">
                  Répartitions par région
                </h2>
                <p className="mt-0.5 text-xs text-ink-500">
                  {apiculteurTotal.toLocaleString("fr-FR")} apiculteurs
                </p>
              </div>
              <span className="text-xs text-ink-400">%Utilisateur</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              {regionDonut.length === 0 ? (
                <p className="text-sm text-ink-500">
                  {stats ? "Aucune région à afficher." : "Chargement…"}
                </p>
              ) : (
                <DonutChart data={regionDonut} size={160} thickness={22} />
              )}
            </div>
          </section>

          {/* Gender bars — naturally sized: the card hugs its content so we
              don't end up with a big slab of empty space below the two bars.
              The donut card above keeps `flex-1` and absorbs the freed
              vertical space, which just centers its 160px chart with a bit
              more breathing room (looks fine, not stretched). */}
          <section className="flex flex-col rounded-[18px] bg-white p-5 shadow-card">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">
                  Répartitions par genre
                </h2>
                <ul className="mt-1 flex items-center gap-3">
                  {genderData.map((g) => (
                    <li
                      key={g.label}
                      className="inline-flex items-center gap-1.5 text-xs text-ink-500"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: g.color }}
                      />
                      {g.label}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="text-xs text-ink-400">%Utilisateur</span>
            </div>
            {genderData.length === 0 || genderData.every((g) => g.value < 0.5) ? (
              <p className="py-2 text-center text-sm text-ink-500">
                {stats ? "Aucune répartition disponible." : "Chargement…"}
              </p>
            ) : (
              <HBarChart data={genderData} size="lg" />
            )}
          </section>
        </div>
      </div>

      {/* Maintenance */}
      <MaintenanceCard
        rows={recentMaintenance}
        emptyState={
          stats ? "Aucune demande pour le moment." : "Chargement…"
        }
      />
    </div>
  );
}
