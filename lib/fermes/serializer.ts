import "server-only";
import type { FermeListItem } from "./types";

export type { FermeListItem, FermeStatus } from "./types";

type LeanFerme = {
  _id?: { toString: () => string } | string;
  name?: string;
  rucheCount?: number;
  address?: string;
  plusCode?: string;
  lat?: number | null;
  lng?: number | null;
  gatewayCount?: number;
  ruchesAttention?: number;
};

function fermeId(raw: LeanFerme["_id"]): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.toString();
}

/** Default country label for Tunisian apiculteurs. */
const DEFAULT_PAYS = "Tunisie";

/**
 * Map an embedded ferme sub-document (+ apiculteur context) to the
 * list row consumed by `/fermes`.
 */
export function toFermeListItem(
  ferme: LeanFerme,
  apiculteurRegion: string
): FermeListItem {
  const ruchesAttention = Math.max(0, ferme.ruchesAttention ?? 0);
  const gateway = Math.max(0, ferme.gatewayCount ?? 1);

  return {
    id: fermeId(ferme._id),
    nom: ferme.name ?? "",
    pays: DEFAULT_PAYS,
    region: apiculteurRegion || "—",
    gateway,
    ruches: ferme.rucheCount ?? 0,
    ruchesAttention,
    status: ruchesAttention > 0 ? "alerte" : "normale",
    address: ferme.address ?? "",
    plusCode: ferme.plusCode ?? "",
    lat: ferme.lat ?? null,
    lng: ferme.lng ?? null,
  };
}
