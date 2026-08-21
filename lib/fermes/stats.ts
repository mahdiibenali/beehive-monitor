import "server-only";
import type { SanitizedFerme } from "@/lib/apiculteurs/sanitize";

/** Recompute top-level counters from the embedded fermes array. */
export function totalsFromFermes(fermes: SanitizedFerme[]) {
  const fermeCount = fermes.length;
  const rucheCount = fermes.reduce((sum, f) => sum + (f.rucheCount ?? 0), 0);
  const ruchesAttention = fermes.reduce(
    (sum, f) => sum + (f.ruchesAttention ?? 0),
    0
  );
  return { fermeCount, rucheCount, ruchesAttention };
}
