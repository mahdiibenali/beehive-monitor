import { RouteGuard } from "@/components/auth/RoleGate";
import { MaintenanceClient } from "./_components/MaintenanceClient";

/**
 * Gestion de maintenance — list of demands filed by apiculteurs.
 * Accessible to super-admin and admin.
 */
export default function MaintenancePage() {
  return (
    <RouteGuard roles={["super-admin", "admin"]}>
      <MaintenanceClient />
    </RouteGuard>
  );
}
