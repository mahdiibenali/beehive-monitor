import { RouteGuard } from "@/components/auth/RoleGate";
import { MesRuchesClient } from "./_components/MesRuchesClient";

/**
 * "Mes ruches" — apiculteur-only.
 * Aggregates every ruche across the signed-in apiculteur's fermes and shows
 * them in a single filterable, sortable list. Row click → detail drawer
 * (Aperçu / Batterie / Capteur / Venin / Alertes).
 */
export default function MesRuchesPage() {
  return (
    <RouteGuard roles={["apiculteur"]}>
      <MesRuchesClient />
    </RouteGuard>
  );
}
