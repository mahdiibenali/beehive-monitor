import { RouteGuard } from "@/components/auth/RoleGate";
import { AdminsClient } from "./_components/AdminsClient";

/**
 * Manage admins — super-admin only.
 * RouteGuard redirects anyone else to /dashboard.
 */
export default function AdminsPage() {
  return (
    <RouteGuard roles={["super-admin"]}>
      <AdminsClient />
    </RouteGuard>
  );
}
