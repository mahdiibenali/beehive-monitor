import "server-only";
import type { RucheListItem } from "./types";

export type { RucheListItem, RucheStatus } from "./types";

type LeanRuche = {
  _id?: { toString: () => string } | string;
  name?: string;
  serial?: string;
  status?: "alerte" | "normale";
  alerts?: number;
  gatewayIndex?: number;
  lat?: number | null;
  lng?: number | null;
};

type LeanFerme = {
  _id?: { toString: () => string } | string;
  name?: string;
  ruches?: LeanRuche[];
};

function idOf(raw: LeanRuche["_id"] | LeanFerme["_id"]): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.toString();
}

/** Country label for Tunisian apiculteurs (no per-row country field yet). */
const DEFAULT_PAYS = "Tunisie";

/**
 * Map an embedded ruche (+ ferme + apiculteur context) to the list row
 * consumed by `/mes-ruches`.
 */
export function toRucheListItem(
  ruche: LeanRuche,
  ferme: LeanFerme,
  apiculteurRegion: string
): RucheListItem {
  const gatewayIndex = Math.max(1, ruche.gatewayIndex ?? 1);
  return {
    id: idOf(ruche._id),
    name: ruche.name ?? "",
    serial: ruche.serial ?? "",
    status: ruche.status ?? "normale",
    alerts: Math.max(0, ruche.alerts ?? 0),
    gatewayIndex,
    gatewayLabel: `Gateway ${gatewayIndex}`,
    lat: ruche.lat ?? null,
    lng: ruche.lng ?? null,

    fermeId: idOf(ferme._id),
    fermeName: ferme.name ?? "",
    region: apiculteurRegion || "—",
    pays: DEFAULT_PAYS,
    localisation: `${apiculteurRegion || "—"} - ${DEFAULT_PAYS}`,
  };
}
