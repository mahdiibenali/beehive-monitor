"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Maximize2,
  Moon,
  Plus,
  Sun,
  TriangleAlert,
  Wind,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { FermeListItem } from "@/lib/fermes/types";
import { RuchesMap } from "./RuchesMap";
import { RucheFormModal, type RucheFormValues } from "./RucheFormModal";
import {
  mockCollecteursActifs,
  mockRuchesForFerme,
  mockWeatherForFerme,
  type MockRuche,
  type MockWeather,
  type WeatherKind,
} from "./fermeMockData";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface FermeDetailDrawerProps {
  open: boolean;
  ferme: FermeListItem | null;
  onClose: () => void;
}

type Tab = "ruches" | "meteo";

/* -------------------------------------------------------------------------- */
/*                              Main component                                */
/* -------------------------------------------------------------------------- */

export function FermeDetailDrawer({
  open,
  ferme,
  onClose,
}: FermeDetailDrawerProps) {
  const [tab, setTab] = useState<Tab>("ruches");
  const [ruches, setRuches] = useState<MockRuche[]>([]);
  const [addRucheOpen, setAddRucheOpen] = useState(false);

  // Re-seed ruches when the drawer opens onto a different ferme.
  useEffect(() => {
    if (ferme) {
      setTab("ruches");
      setRuches(mockRuchesForFerme(ferme));
    } else {
      setRuches([]);
    }
  }, [ferme?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !addRucheOpen) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, addRucheOpen]);

  const collecteursActifs = ferme ? mockCollecteursActifs(ferme) : 0;
  const weather = useMemo<MockWeather | null>(
    () => (ferme ? mockWeatherForFerme(ferme) : null),
    [ferme]
  );

  // Stats reflect the *live* local ruches list so they update after Add.
  const ruchesTotal = ruches.length;
  const alertesTotal = ruches.filter((r) => r.status === "alerte").length;

  // Suggested name for the next ruche: continue alphabetical pattern
  // ("Ruche A1", "Ruche A2", … → "Ruche A<n+1>") when the list looks like it,
  // otherwise just append "Ruche <n+1>".
  const suggestedName = useMemo(() => {
    const m = ruches[ruches.length - 1]?.name.match(/^Ruche\s+([A-Za-z]+)(\d+)$/);
    if (m) return `Ruche ${m[1]}${Number(m[2]) + 1}`;
    return `Ruche ${ruches.length + 1}`;
  }, [ruches]);

  async function handleAddRuche(
    values: RucheFormValues
  ): Promise<{ ok: boolean; error?: string }> {
    if (!ferme) return { ok: false, error: "Aucune ferme sélectionnée." };

    // Auto-position around the ferme if the user didn't override.
    const baseLat = ferme.lat ?? null;
    const baseLng = ferme.lng ?? null;
    const autoLat =
      baseLat !== null ? baseLat + (Math.random() - 0.5) * 0.006 : null;
    const autoLng =
      baseLng !== null ? baseLng + (Math.random() - 0.5) * 0.008 : null;

    const newRuche: MockRuche = {
      id: `${ferme.id}-r-new-${Date.now()}`,
      name: values.name,
      localisation: `${ferme.region} - ${ferme.pays}`,
      status: values.status,
      alerts:
        values.status === "alerte" ? 1 + Math.floor(Math.random() * 3) : 0,
      lat: values.lat ?? autoLat,
      lng: values.lng ?? autoLng,
    };
    setRuches((prev) => [...prev, newRuche]);
    return { ok: true };
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Sliding panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ferme ? `Détails de ${ferme.nom}` : "Détails ferme"}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[760px] flex-col overflow-hidden rounded-l-3xl bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {ferme && weather && (
          <>
            {/* Top icon row */}
            <div className="flex items-center justify-between px-6 pt-5">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-500 transition-colors hover:bg-ink-50 hover:text-brand-purple"
                aria-label="Agrandir"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-brand-purple"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Title row */}
            <header className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4">
              <h2 className="text-xl font-semibold text-ink-900">
                {ferme.nom}
              </h2>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setAddRucheOpen(true)}
              >
                Ajouter ruche
              </Button>
            </header>

            {/* Stats strip */}
            <div className="mx-6 mt-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-ink-100 bg-ink-50/40">
              <StatCell label="RUCHES" value={pad2(ruchesTotal)} />
              <StatCell
                label="ALERTES"
                value={pad2(alertesTotal)}
                divider
              />
              <StatCell label="GATEWAY" value={pad2(ferme.gateway)} divider />
            </div>

            {/* Tabs */}
            <div className="mx-6 mt-4 flex rounded-pill bg-primary-50 p-1">
              <TabButton
                active={tab === "ruches"}
                onClick={() => setTab("ruches")}
              >
                Ruches
              </TabButton>
              <TabButton
                active={tab === "meteo"}
                onClick={() => setTab("meteo")}
              >
                Météo
              </TabButton>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
              {tab === "ruches" ? (
                <RuchesTab
                  ferme={ferme}
                  ruches={ruches}
                  collecteursActifs={collecteursActifs}
                />
              ) : (
                <MeteoTab weather={weather} />
              )}
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-end gap-3 border-t border-ink-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center rounded-pill bg-primary-50 px-5 text-sm font-semibold text-brand-purple transition-colors hover:bg-primary-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center rounded-pill bg-brand-orange px-5 text-sm font-semibold text-white transition-colors hover:brightness-110"
              >
                Confirmer
              </button>
            </footer>
          </>
        )}
      </aside>

      {/* Add-ruche modal (portals out of the drawer) */}
      {ferme && (
        <RucheFormModal
          open={addRucheOpen}
          onClose={() => setAddRucheOpen(false)}
          fermeName={ferme.nom}
          suggestedName={suggestedName}
          onSubmit={handleAddRuche}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Tabs body                                  */
/* -------------------------------------------------------------------------- */

function RuchesTab({
  ferme,
  ruches,
  collecteursActifs,
}: {
  ferme: FermeListItem;
  ruches: MockRuche[];
  collecteursActifs: number;
}) {
  return (
    <>
      {/* Collecteurs banner */}
      <div className="flex items-center justify-between rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="block h-2 w-2 rounded-full bg-brand-purple" />
          <span className="text-sm font-medium text-ink-800">
            {pad2(collecteursActifs)} Collecteurs en marche
          </span>
        </div>
        <span className="inline-flex h-6 items-center rounded-full bg-primary-100 px-2.5 text-xs font-semibold text-brand-purple">
          Active
        </span>
      </div>

      {/* Map */}
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">
            Répartitions géographique
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="block h-2 w-2 rounded-full bg-brand-orange" />
              Alerte
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="block h-2 w-2 rounded-full bg-brand-purple" />
              Normale
            </span>
          </div>
        </div>
        <RuchesMap
          ruches={ruches}
          fallbackLat={ferme.lat}
          fallbackLng={ferme.lng}
          className="aspect-[2/1]"
        />
      </section>

      {/* Ruches sub-table (compact, drawer-fit) */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                FERMES
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                LOCALISATION
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                STATUE
              </th>
              <th className="px-3 py-2.5 text-right">
                <TriangleAlert className="ml-auto h-3.5 w-3.5 text-ink-400" />
              </th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {ruches.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-ink-500">
                  Aucune ruche enregistrée sur cette ferme.
                </td>
              </tr>
            ) : (
              ruches.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-ink-900">
                    {r.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm text-ink-700">
                    {r.localisation}
                  </td>
                  <td className="px-3 py-2.5">
                    <RucheStatusPill status={r.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {r.alerts > 0 ? (
                      <span className="inline-flex h-6 min-w-[34px] items-center justify-center rounded-md bg-brand-orange px-2 text-xs font-semibold text-white">
                        {pad2(r.alerts)}
                      </span>
                    ) : (
                      <span className="text-sm text-ink-500">0</span>
                    )}
                  </td>
                  <td className="w-10 px-2 py-2.5">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        aria-label={`Ouvrir ${r.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition-colors hover:bg-primary-50 hover:text-brand-purple"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}

function MeteoTab({ weather }: { weather: MockWeather }) {
  const chart = useMemo(() => buildChart(weather.hourly), [weather]);

  return (
    <>
      {/* Current */}
      <section className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-ink-50/40 px-4 py-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
          <WeatherIcon kind={weather.kind} className="h-7 w-7 text-brand-purple" />
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-semibold leading-none text-ink-900">
            {weather.currentTemp}°
          </p>
          <p className="mt-1 truncate text-xs text-ink-500">
            {weather.location}
          </p>
        </div>
      </section>

      {/* Quick metrics */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric
          icon={<Cloud className="h-3.5 w-3.5 text-ink-400" />}
          value={`${weather.precipitationMm}mm`}
        />
        <Metric
          icon={<Droplets className="h-3.5 w-3.5 text-ink-400" />}
          value={`${weather.humidityPct}%`}
        />
        <Metric
          icon={<Wind className="h-3.5 w-3.5 text-ink-400" />}
          value={`${weather.windKmh} km/h`}
        />
      </div>

      {/* Hourly chart — soft frosted purple gradient card */}
      <section className="relative mt-4 overflow-hidden rounded-2xl px-4 pb-3 pt-4 backdrop-blur-md">
        {/* Blurred gradient layer (sits underneath the content) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#8986E2]/15 to-[#B0AEEC]/15"
          style={{ filter: "blur(18px)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#8986E2]/10 to-[#B0AEEC]/10"
        />
        {/* Hours + icons + temps */}
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${weather.hourly.length}, minmax(0, 1fr))`,
          }}
        >
          {weather.hourly.map((h) => (
            <div
              key={h.hour}
              className="flex flex-col items-center text-center"
            >
              <span className="text-[11px] font-medium text-ink-500">
                {h.hour}
              </span>
              <span className="mt-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple text-white shadow-[0_4px_10px_-2px_rgba(93,79,236,0.45)]">
                <WeatherIcon kind={h.kind} className="h-5 w-5" />
              </span>
              <span className="mt-1.5 text-sm font-semibold text-ink-900">
                {pad2(h.temp)}°
              </span>
            </div>
          ))}
        </div>

        {/* Smooth curve */}
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="mt-3 h-20 w-full"
          preserveAspectRatio="none"
        >
          <path
            d={chart.path}
            fill="none"
            stroke="#9C90F5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {chart.dots.map((d, i) => (
            <g key={i}>
              <circle cx={d.x} cy={d.y} r={6} fill="#9C90F5" opacity={0.35} />
              <circle cx={d.x} cy={d.y} r={3.5} fill="#9C90F5" />
            </g>
          ))}
        </svg>

        {/* Rain probability row */}
        <div
          className="mt-2 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${weather.hourly.length}, minmax(0, 1fr))`,
          }}
        >
          {weather.hourly.map((h) => (
            <div
              key={h.hour}
              className="flex items-center justify-center gap-1 text-[11px] font-medium text-ink-500"
            >
              <Droplets className="h-3 w-3 text-brand-purple/70" />
              {h.rainPct}%
            </div>
          ))}
        </div>
      </section>

      {/* Daily forecast */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/40">
        {weather.daily.map((d, i) => (
          <div
            key={d.label}
            className={cn(
              "flex items-center gap-4 px-4 py-2.5 text-sm",
              i !== 0 && "border-t border-ink-100"
            )}
          >
            <span
              className={cn(
                "w-24 shrink-0",
                d.label === "Hier" ? "text-ink-400" : "text-ink-800"
              )}
            >
              {d.label}
            </span>
            <span className="flex flex-1 items-center justify-end gap-1 text-xs text-ink-500">
              <Droplets className="h-3 w-3 text-brand-purple/60" />
              {d.rainPct}%
            </span>
            <WeatherIcon kind={d.kind} className="h-4 w-4 text-ink-500" />
            {d.isNight ? (
              <Moon className="h-4 w-4 text-ink-500" />
            ) : (
              <Sun className="h-4 w-4 text-ink-500" />
            )}
            <span className="w-12 text-right text-sm font-semibold text-ink-800">
              {pad2(d.high)}°
            </span>
            <span className="w-12 text-right text-sm text-ink-500">
              {pad2(d.low)}°
            </span>
          </div>
        ))}
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Subcomponents                               */
/* -------------------------------------------------------------------------- */

function StatCell({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-4 py-3",
        divider && "border-l border-ink-100"
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
        {label}
      </span>
      <span className="text-2xl font-semibold leading-none text-ink-900">
        {value}
      </span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 flex-1 items-center justify-center rounded-pill text-sm font-medium transition-colors",
        active
          ? "bg-brand-purple text-white shadow-sm"
          : "text-ink-600 hover:text-brand-purple"
      )}
    >
      {children}
    </button>
  );
}

function RucheStatusPill({ status }: { status: "alerte" | "normale" }) {
  if (status === "alerte") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-[#9B5A1F]">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
        Alerte
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-brand-purple">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />
      Normale
    </span>
  );
}

function Metric({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-pill bg-ink-50 px-3 py-1.5">
      <span className="text-xs font-medium text-ink-700">{value}</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
        {icon}
      </span>
    </div>
  );
}

function WeatherIcon({
  kind,
  className,
}: {
  kind: WeatherKind;
  className?: string;
}) {
  if (kind === "sun") return <Sun className={className} />;
  if (kind === "cloud-sun") return <CloudSun className={className} />;
  if (kind === "cloud-rain") return <CloudRain className={className} />;
  return <Cloud className={className} />;
}

/* -------------------------------------------------------------------------- */
/*                               Chart helpers                                */
/* -------------------------------------------------------------------------- */

function buildChart(hourly: MockWeather["hourly"]) {
  const width = 100 * hourly.length;
  const height = 60;
  const temps = hourly.map((h) => h.temp);
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const range = Math.max(1, max - min);

  const padTop = 10;
  const padBottom = 10;
  const usableH = height - padTop - padBottom;

  const dots = hourly.map((h, i) => {
    const x = (i + 0.5) * (width / hourly.length);
    const y = padTop + (1 - (h.temp - min) / range) * usableH;
    return { x, y };
  });

  // Build a smooth Catmull-Rom -> cubic Bezier path so the curve flows
  // gently through every dot instead of forming sharp angles.
  const path = catmullRomPath(dots);

  return { width, height, dots, path };
}

/** Catmull-Rom to cubic Bezier conversion, alpha=0.5 (centripetal). */
function catmullRomPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const d: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

function pad2(n: number): string {
  return String(Math.max(0, Math.round(n))).padStart(2, "0");
}
