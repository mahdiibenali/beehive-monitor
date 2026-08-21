import "server-only";

export interface SanitizedFerme {
  name: string;
  rucheCount: number;
  address: string;
  plusCode: string;
  lat: number | null;
  lng: number | null;
  gatewayCount: number;
  ruchesAttention: number;
}

/**
 * Normalise the fermes array sent from the client.
 * Drops invalid entries and clamps numeric fields to safe ranges.
 */
export function sanitizeFermes(raw: unknown): SanitizedFerme[] {
  if (!Array.isArray(raw)) return [];
  const out: SanitizedFerme[] = [];
  for (const item of raw.slice(0, 50)) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (name.length < 1) continue;
    out.push({
      name: name.slice(0, 120),
      rucheCount:
        typeof r.rucheCount === "number" && r.rucheCount >= 0
          ? Math.floor(r.rucheCount)
          : 0,
      address:
        typeof r.address === "string" ? r.address.trim().slice(0, 240) : "",
      plusCode:
        typeof r.plusCode === "string" ? r.plusCode.trim().slice(0, 16) : "",
      lat:
        typeof r.lat === "number" && Number.isFinite(r.lat) ? r.lat : null,
      lng:
        typeof r.lng === "number" && Number.isFinite(r.lng) ? r.lng : null,
      gatewayCount:
        typeof r.gatewayCount === "number" && r.gatewayCount >= 0
          ? Math.floor(r.gatewayCount)
          : 1,
      ruchesAttention:
        typeof r.ruchesAttention === "number" && r.ruchesAttention >= 0
          ? Math.floor(r.ruchesAttention)
          : 0,
    });
  }
  return out;
}
