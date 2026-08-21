import { RouteGuard } from "@/components/auth/RoleGate";
import { FermesClient } from "./_components/FermesClient";

/**
 * "Fermes" — apiculteur view of every farm they own, with per-row
 * gateway / ruche counts and an "attention required" highlight. Today
 * the data is mocked client-side; the same component will be wired to
 * a real `/api/fermes` endpoint when it lands.
 */
export default function FermesPage() {
  return (
    <RouteGuard roles={["apiculteur"]}>
      <FermesClient />
    </RouteGuard>
  );
}
