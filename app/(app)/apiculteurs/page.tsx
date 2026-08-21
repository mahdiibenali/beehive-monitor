import { RouteGuard } from "@/components/auth/RoleGate";
import { ApiculteursClient } from "./_components/ApiculteursClient";

/**
 * Gestion d'abonnements — apiculteur management page.
 * Accessible to super-admin and admin. Admins may eventually be scoped
 * to their region via the API layer.
 */
export default function ApiculteursPage() {
  return (
    <RouteGuard roles={["super-admin", "admin"]}>
      <ApiculteursClient />
    </RouteGuard>
  );
}
