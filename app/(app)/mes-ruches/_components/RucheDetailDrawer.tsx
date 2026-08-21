"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BatteryCharging,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Droplets,
  Gauge,
  Maximize2,
  Plus,
  Plug,
  Radio,
  Thermometer,
  TriangleAlert,
  Wifi,
  Wind,
  Zap,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { RucheRow } from "./types";
import {
  mockMetricsForRuche,
  type AnomalyTone,
  type RucheMetrics,
} from "./rucheMockData";
import { AlertsTable } from "./AlertsTable";
import { TimeSeriesMiniChart } from "./TimeSeriesMiniChart";
import { PlanificationSection } from "./PlanificationSection";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Tab = "apercu" | "batterie" | "capteur" | "venin" | "alertes";

interface RucheDetailDrawerProps {
  open: boolean;
  row: RucheRow | null;
  /** Every ruche of the apiculteur — used to populate the "Voir plus" sub-table. */
  ruches: RucheRow[];
  onClose: () => void;
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "apercu", label: "Aperçu" },
  { id: "batterie", label: "Batterie" },
  { id: "capteur", label: "Capteur" },
  { id: "venin", label: "Venin" },
  { id: "alertes", label: "Alertes" },
];

/* -------------------------------------------------------------------------- */
/*                              Main component                                */
/* -------------------------------------------------------------------------- */

export function RucheDetailDrawer({
  open,
  row,
  ruches,
  onClose,
}: RucheDetailDrawerProps) {
  const [tab, setTab] = useState<Tab>("apercu");

  useEffect(() => {
    if (row) setTab("apercu");
  }, [row?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const metrics = useMemo<RucheMetrics | null>(
    () => (row ? mockMetricsForRuche(row) : null),
    [row]
  );

  // Ruches of the same ferme — shown in the "Voir plus" sub-table.
  const fermeRuches = useMemo(
    () => (row ? ruches.filter((r) => r.fermeId === row.fermeId) : []),
    [row, ruches]
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={row ? `Détails de ${row.name}` : "Détails ruche"}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-l-3xl bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {row && metrics && (
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

            {/* Breadcrumb title + action */}
            <header className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4">
              <Breadcrumb
                segments={[
                  row.fermeName,
                  row.gatewayLabel,
                  row.name,
                ]}
              />
              <Button leftIcon={<Plus className="h-4 w-4" />}>Ajouter ruche</Button>
            </header>

            {/* Stats strip */}
            <div className="mx-6 mt-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-ink-100 bg-ink-50/40">
              <StatCell label="RUCHES" value={pad2(fermeRuches.length)} />
              <StatCell
                label="ALERTES"
                value={pad2(metrics.alertesCount)}
                divider
              />
              <StatCell
                label="GATEWAY"
                value={pad2(metrics.gatewayCount)}
                divider
              />
            </div>

            {/* Tabs */}
            <div className="mx-6 mt-4 flex rounded-pill bg-primary-50 p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center rounded-pill text-xs font-medium transition-colors sm:text-sm",
                    tab === t.id
                      ? "bg-brand-purple text-white shadow-sm"
                      : "text-ink-600 hover:text-brand-purple"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
              {tab === "apercu" && (
                <ApercuTab
                  row={row}
                  ruches={fermeRuches}
                  metrics={metrics}
                />
              )}
              {tab === "batterie" && <BatterieTab metrics={metrics} />}
              {tab === "capteur" && <CapteurTab metrics={metrics} />}
              {tab === "venin" && <VeninTab metrics={metrics} />}
              {tab === "alertes" && <AlertesTab metrics={metrics} />}
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Aperçu                                    */
/* -------------------------------------------------------------------------- */

function ApercuTab({
  row,
  ruches,
  metrics,
}: {
  row: RucheRow;
  ruches: RucheRow[];
  metrics: RucheMetrics;
}) {
  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [batterieOpen, setBatterieOpen] = useState(true);
  const [veninOpen, setVeninOpen] = useState(true);
  const [showAllRuches, setShowAllRuches] = useState(false);

  const visibleRuches = showAllRuches ? ruches : ruches.slice(0, 3);

  return (
    <>
      {/* Collecteurs banner */}
      <div className="flex items-center justify-between rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="block h-2 w-2 rounded-full bg-brand-purple" />
          <span className="text-sm font-medium text-ink-800">
            {pad2(metrics.collecteursActifs)} Collecteurs en marche
          </span>
        </div>
        <span className="inline-flex h-6 items-center rounded-full bg-primary-100 px-2.5 text-xs font-semibold text-brand-purple">
          Active
        </span>
      </div>

      {/* Sub-table of ruches in the same ferme */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-ink-100 bg-white">
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
            {visibleRuches.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-ink-500">
                  Aucune autre ruche dans cette ferme.
                </td>
              </tr>
            ) : (
              visibleRuches.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    "border-b border-ink-100 last:border-b-0",
                    r.id === row.id ? "bg-primary-50/40" : "hover:bg-ink-50/60"
                  )}
                >
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-ink-900">
                    {r.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm text-ink-700">
                    {r.region} - {r.pays}
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
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-500">
                        <Maximize2 className="h-3 w-3" />
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Voir plus button */}
      {ruches.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAllRuches((v) => !v)}
          className="mt-3 flex w-full items-center justify-center rounded-pill bg-primary-100 px-4 py-2.5 text-sm font-medium text-brand-purple transition-colors hover:bg-primary-200"
        >
          {showAllRuches ? "Voir moins" : "Voir plus"}
        </button>
      )}

      {/* CONDITIONS INTERNES */}
      <SectionGroup
        title="CONDITIONS INTERNES"
        open={conditionsOpen}
        onToggle={() => setConditionsOpen((v) => !v)}
      >
        <div className="grid grid-cols-2 gap-3">
          <BigMetricCard
            label="Température"
            value={`${metrics.temperature.value}${metrics.temperature.unit}`}
            icon={<Thermometer className="h-4 w-4" />}
            tone={metrics.temperature.tone}
          />
          <BigMetricCard
            label="Humidité"
            value={`${metrics.humidity.value}${metrics.humidity.unit}`}
            icon={<Droplets className="h-4 w-4" />}
            tone={metrics.humidity.tone}
          />
        </div>

        <MetricRow
          icon={<TriangleAlert className="h-4 w-4" />}
          label="Anomalies"
          right={
            <BadgePill label={metrics.anomalies.label} tone={metrics.anomalies.tone} />
          }
          tone={metrics.anomalies.tone}
        />
        <MetricRow
          icon={<Zap className="h-4 w-4" />}
          label="Mouvement"
          right={
            <BadgePill label={metrics.mouvement.label} tone={metrics.mouvement.tone} />
          }
          tone={metrics.mouvement.tone}
        />
        <MetricRow
          icon={<Gauge className="h-4 w-4" />}
          label="Pression"
          right={
            <span
              className={cn(
                "text-sm font-medium",
                metrics.pression.tone === "warning"
                  ? "text-brand-orange"
                  : metrics.pression.tone === "anomaly"
                  ? "text-brand-orange"
                  : "text-ink-800"
              )}
            >
              {metrics.pression.value} {metrics.pression.unit}
            </span>
          }
          tone={metrics.pression.tone}
        />
        <MetricRow
          icon={<Wind className="h-4 w-4" />}
          label="Vitesse abeilles"
          right={
            <span className="text-sm font-medium text-ink-800">
              {metrics.vitesseAbeilles.value} {metrics.vitesseAbeilles.unit}
            </span>
          }
        />
      </SectionGroup>

      {/* BATTERIE ET CONNEXION */}
      <SectionGroup
        title="BATTERIE ET CONNEXION"
        open={batterieOpen}
        onToggle={() => setBatterieOpen((v) => !v)}
      >
        <MetricRow
          icon={<BatteryCharging className="h-4 w-4" />}
          label="Batterie-S"
          right={
            <div className="flex items-center gap-2">
              <ProgressBar value={metrics.batterieS.percent} />
              <span className="text-xs font-medium text-ink-700">
                {metrics.batterieS.percent}%
              </span>
            </div>
          }
          tone={metrics.batterieS.tone}
        />
        <MetricRow
          icon={<BatteryCharging className="h-4 w-4" />}
          label="Batterie-C"
          right={
            <BadgePill label={metrics.batterieC.label} tone={metrics.batterieC.tone} />
          }
          tone={metrics.batterieC.tone}
        />
        <MetricRow
          icon={<Wifi className="h-4 w-4" />}
          label="Gateway"
          right={
            <span className="text-sm font-medium text-ink-800">
              {metrics.gatewayId}
            </span>
          }
        />
      </SectionGroup>

      {/* COLLECTEUR DE VENIN */}
      <SectionGroup
        title="COLLECTEUR DE VENIN"
        open={veninOpen}
        onToggle={() => setVeninOpen((v) => !v)}
      >
        <MetricRow
          icon={<Activity className="h-4 w-4" />}
          label="Activité"
          right={
            <BadgePill label={metrics.activite.label} tone={metrics.activite.tone} />
          }
          tone={metrics.activite.tone}
        />
        <MetricRow
          icon={<Plug className="h-4 w-4" />}
          label="Etat câbles"
          right={
            <BadgePill label={metrics.etatCables.label} tone={metrics.etatCables.tone} />
          }
          tone={metrics.etatCables.tone}
        />
        <MetricRow
          icon={<Zap className="h-4 w-4" />}
          label="Tension câbles"
          right={
            <span className="text-sm font-medium text-ink-800">
              {metrics.tensionCables.value}
              {metrics.tensionCables.unit}
            </span>
          }
        />
        <MetricRow
          icon={<Radio className="h-4 w-4" />}
          label="Plaques"
          right={
            <div className="flex items-center gap-2">
              <ProgressBar value={metrics.plaques.percent} />
              <span className="text-xs font-medium text-ink-700">
                {metrics.plaques.percent}%
              </span>
            </div>
          }
          tone={metrics.plaques.tone}
        />
      </SectionGroup>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Other tabs                                   */
/* -------------------------------------------------------------------------- */

function BatterieTab({ metrics }: { metrics: RucheMetrics }) {
  const [tensionOpen, setTensionOpen] = useState(true);
  const [plaquesOpen, setPlaquesOpen] = useState(false);

  return (
    <div className="space-y-4">
      <AlertsTable alerts={metrics.alerts} filterType="batterie" />

      {/* Collecteur status banner */}
      <CollecteurBanner active={metrics.collecteurActif} />

      <SectionGroup title="COLLECTEUR DE VENIN" open onToggle={() => {}}>
        <MetricRow
          icon={<Activity className="h-4 w-4" />}
          label="Activité"
          right={
            <BadgePill label={metrics.activite.label} tone={metrics.activite.tone} />
          }
          tone={metrics.activite.tone}
        />
        <MetricRow
          icon={<Plug className="h-4 w-4" />}
          label="Etat câbles"
          right={
            <BadgePill label={metrics.etatCables.label} tone={metrics.etatCables.tone} />
          }
          tone={metrics.etatCables.tone}
        />

        {/* Tension câbles — expandable with chart */}
        <ExpandableMetricRow
          icon={<Zap className="h-4 w-4" />}
          label="Tension câbles"
          right={
            <span className="text-sm font-medium text-ink-800">
              {metrics.tensionCables.value}
              {metrics.tensionCables.unit}
            </span>
          }
          open={tensionOpen}
          onToggle={() => setTensionOpen((v) => !v)}
        >
          <TimeSeriesMiniChart title="Tension" series={metrics.tensionSeries} />
        </ExpandableMetricRow>

        {/* Plaques — collapsible */}
        <ExpandableMetricRow
          icon={<Radio className="h-4 w-4" />}
          label="Plaques"
          right={
            <div className="flex items-center gap-2">
              <ProgressBar value={metrics.plaques.percent} />
              <span className="text-xs font-medium text-ink-700">
                {metrics.plaques.percent}%
              </span>
            </div>
          }
          open={plaquesOpen}
          onToggle={() => setPlaquesOpen((v) => !v)}
          tone={metrics.plaques.tone}
        >
          <p className="text-xs text-ink-500">
            Plaques chargées à {metrics.plaques.percent}%. Prêt pour la
            prochaine session de collecte.
          </p>
        </ExpandableMetricRow>
      </SectionGroup>

      {/* Production venin chart */}
      <section className="rounded-2xl border border-ink-100 bg-white p-4">
        <TimeSeriesMiniChart
          title="Production venin"
          series={metrics.productionSeries}
        />
      </section>

      {/* Planification du collecteur */}
      <PlanificationSection sessions={metrics.sessions} />
    </div>
  );
}

function CapteurTab({ metrics }: { metrics: RucheMetrics }) {
  return (
    <SectionGroup title="CAPTEUR — LECTURES TEMPS RÉEL" open onToggle={() => {}}>
      <div className="grid grid-cols-2 gap-3">
        <BigMetricCard
          label="Température"
          value={`${metrics.temperature.value}${metrics.temperature.unit}`}
          icon={<Thermometer className="h-4 w-4" />}
          tone={metrics.temperature.tone}
        />
        <BigMetricCard
          label="Humidité"
          value={`${metrics.humidity.value}${metrics.humidity.unit}`}
          icon={<Droplets className="h-4 w-4" />}
          tone={metrics.humidity.tone}
        />
      </div>
      <MetricRow
        icon={<Gauge className="h-4 w-4" />}
        label="Pression"
        right={
          <span className="text-sm font-medium text-ink-800">
            {metrics.pression.value} {metrics.pression.unit}
          </span>
        }
        tone={metrics.pression.tone}
      />
      <MetricRow
        icon={<Wind className="h-4 w-4" />}
        label="Vitesse abeilles"
        right={
          <span className="text-sm font-medium text-ink-800">
            {metrics.vitesseAbeilles.value} {metrics.vitesseAbeilles.unit}
          </span>
        }
      />
      <MetricRow
        icon={<Zap className="h-4 w-4" />}
        label="Mouvement"
        right={
          <BadgePill label={metrics.mouvement.label} tone={metrics.mouvement.tone} />
        }
        tone={metrics.mouvement.tone}
      />
    </SectionGroup>
  );
}

function VeninTab({ metrics }: { metrics: RucheMetrics }) {
  const [anomaliesOpen, setAnomaliesOpen] = useState(false);
  const [mouvementOpen, setMouvementOpen] = useState(false);
  const [pressionOpen, setPressionOpen] = useState(true);
  const [vitesseOpen, setVitesseOpen] = useState(false);

  return (
    <div className="space-y-4">
      <AlertsTable alerts={metrics.alerts} filterType="venin" />

      <SectionGroup title="CONDITIONS INTERNES" open onToggle={() => {}}>
        {/* Reine enceinte banner */}
        {metrics.reineEnceinte && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-brand-purple px-4 py-3 text-white">
            <span className="block h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-medium">Reine enceinte</span>
          </div>
        )}

        {/* Big temperature & humidity cards */}
        <div className="grid grid-cols-2 gap-3">
          <BigMetricCard
            label="Température"
            value={`${metrics.temperature.value}${metrics.temperature.unit}`}
            icon={<Thermometer className="h-4 w-4" />}
            tone={metrics.temperature.tone}
          />
          <BigMetricCard
            label="Humidité"
            value={`${metrics.humidity.value}${metrics.humidity.unit}`}
            icon={<Droplets className="h-4 w-4" />}
            tone={metrics.humidity.tone}
          />
        </div>

        {/* Anomalies */}
        <ExpandableMetricRow
          icon={<TriangleAlert className="h-4 w-4" />}
          label="Anomalies"
          right={
            <BadgePill label={metrics.anomalies.label} tone={metrics.anomalies.tone} />
          }
          open={anomaliesOpen}
          onToggle={() => setAnomaliesOpen((v) => !v)}
          tone={metrics.anomalies.tone}
        >
          <p className="text-xs text-ink-500">
            Activité des abeilles {metrics.anomalies.label.toLowerCase()}.
            Surveillance recommandée.
          </p>
        </ExpandableMetricRow>

        {/* Mouvement */}
        <ExpandableMetricRow
          icon={<Zap className="h-4 w-4" />}
          label="Mouvement"
          right={
            <BadgePill label={metrics.mouvement.label} tone={metrics.mouvement.tone} />
          }
          open={mouvementOpen}
          onToggle={() => setMouvementOpen((v) => !v)}
          tone={metrics.mouvement.tone}
        >
          <p className="text-xs text-ink-500">
            Niveau d&apos;activité interne mesuré sur les dernières 24h.
          </p>
        </ExpandableMetricRow>

        {/* Pression — with inline chart */}
        <ExpandableMetricRow
          icon={<Gauge className="h-4 w-4" />}
          label="Pression"
          right={
            <span
              className={cn(
                "text-sm font-medium",
                metrics.pression.tone !== "ok"
                  ? "text-brand-orange"
                  : "text-ink-800"
              )}
            >
              {metrics.pression.value} {metrics.pression.unit}
            </span>
          }
          open={pressionOpen}
          onToggle={() => setPressionOpen((v) => !v)}
          tone={metrics.pression.tone}
        >
          <TimeSeriesMiniChart title="Pression" series={metrics.pressionSeries} />
        </ExpandableMetricRow>

        {/* Vitesse abeilles */}
        <ExpandableMetricRow
          icon={<Wind className="h-4 w-4" />}
          label="Vitesse abeilles"
          right={
            <span className="text-sm font-medium text-ink-800">
              {metrics.vitesseAbeilles.value} {metrics.vitesseAbeilles.unit}
            </span>
          }
          open={vitesseOpen}
          onToggle={() => setVitesseOpen((v) => !v)}
        >
          <p className="text-xs text-ink-500">
            Vitesse moyenne des abeilles à l&apos;entrée de la ruche.
          </p>
        </ExpandableMetricRow>
      </SectionGroup>
    </div>
  );
}

function AlertesTab({ metrics }: { metrics: RucheMetrics }) {
  return (
    <div className="space-y-4">
      <AlertsTable alerts={metrics.alerts} initialRows={11} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Shared tab helpers                              */
/* -------------------------------------------------------------------------- */

function CollecteurBanner({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border px-4 py-3",
        active
          ? "border-primary-100 bg-primary-50/60"
          : "border-ink-100 bg-ink-50/60"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "block h-2 w-2 rounded-full",
            active ? "bg-brand-purple" : "bg-ink-400"
          )}
        />
        <span className="text-sm font-medium text-ink-800">
          Collecteur {active ? "activé" : "désactivé"}
        </span>
      </div>
      <span
        className={cn(
          "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
          active
            ? "bg-primary-100 text-brand-purple"
            : "bg-ink-100 text-ink-500"
        )}
      >
        {active ? "Activé" : "Désactivé"}
      </span>
    </div>
  );
}

/**
 * A MetricRow that can expand to reveal extra content (chart, description…).
 * The chevron flips and the row keeps its tone styling.
 */
function ExpandableMetricRow({
  icon,
  label,
  right,
  tone = "ok",
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  right: React.ReactNode;
  tone?: AnomalyTone;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const borderCls =
    tone === "anomaly"
      ? "border-brand-orange/40"
      : tone === "warning"
      ? "border-brand-orange/25"
      : "border-ink-100";
  const iconCls =
    tone === "anomaly"
      ? "bg-brand-orange/10 text-brand-orange"
      : "bg-primary-50 text-brand-purple";

  return (
    <div className={cn("rounded-2xl border bg-white", borderCls)}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              iconCls
            )}
          >
            {icon}
          </span>
          <span className="truncate text-sm font-medium text-ink-800">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {right}
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-ink-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
          )}
        </div>
      </button>
      {open && (
        <div className="border-t border-ink-100 px-4 pb-4 pt-3">{children}</div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                */
/* -------------------------------------------------------------------------- */

function Breadcrumb({ segments }: { segments: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-base font-semibold text-ink-900">
      {segments.map((s, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-400" />}
          <span
            className={cn(
              i === segments.length - 1 ? "text-ink-900" : "text-ink-500"
            )}
          >
            {s}
          </span>
        </span>
      ))}
    </div>
  );
}

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

function SectionGroup({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          {title}
        </h3>
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Réduire" : "Développer"}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition-colors hover:bg-primary-50 hover:text-brand-purple"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>
      </header>
      {open && <div className="space-y-2.5">{children}</div>}
    </section>
  );
}

function BigMetricCard({
  label,
  value,
  icon,
  tone = "ok",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: AnomalyTone;
}) {
  const toneCls =
    tone === "anomaly"
      ? "border-brand-orange/50 bg-accent-50/40"
      : tone === "warning"
      ? "border-brand-orange/30 bg-accent-50/20"
      : "border-ink-100 bg-white";
  const valueCls = tone !== "ok" ? "text-brand-orange" : "text-ink-900";
  const iconCls =
    tone === "anomaly"
      ? "bg-brand-orange text-white"
      : "bg-primary-100 text-brand-purple";

  return (
    <div className={cn("flex flex-col rounded-2xl border px-4 py-3", toneCls)}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-ink-600">{label}</span>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full",
            iconCls
          )}
        >
          {icon}
        </span>
      </div>
      <span className={cn("mt-1 text-2xl font-semibold leading-tight", valueCls)}>
        {value}
      </span>
    </div>
  );
}

function MetricRow({
  icon,
  label,
  right,
  tone = "ok",
}: {
  icon: React.ReactNode;
  label: string;
  right: React.ReactNode;
  tone?: AnomalyTone;
}) {
  const borderCls =
    tone === "anomaly"
      ? "border-brand-orange/40"
      : tone === "warning"
      ? "border-brand-orange/25"
      : "border-ink-100";
  const iconCls =
    tone === "anomaly"
      ? "bg-brand-orange/10 text-brand-orange"
      : "bg-primary-50 text-brand-purple";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-2.5",
        borderCls
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            iconCls
          )}
        >
          {icon}
        </span>
        <span className="truncate text-sm font-medium text-ink-800">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {right}
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </div>
    </div>
  );
}

function BadgePill({
  label,
  tone,
}: {
  label: string;
  tone: AnomalyTone;
}) {
  if (tone === "anomaly") {
    return (
      <span className="inline-flex h-6 items-center rounded-full bg-brand-orange px-2.5 text-xs font-semibold text-white">
        {label}
      </span>
    );
  }
  if (tone === "warning") {
    return (
      <span className="inline-flex h-6 items-center rounded-full bg-accent-50 px-2.5 text-xs font-semibold text-[#9B5A1F]">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-primary-100 px-2.5 text-xs font-semibold text-brand-purple">
      {label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <span className="block h-1.5 w-20 overflow-hidden rounded-full bg-ink-100">
      <span
        className="block h-full rounded-full bg-brand-purple"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
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

function pad2(n: number): string {
  return String(Math.max(0, Math.round(n))).padStart(2, "0");
}
