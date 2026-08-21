import { RouteGuard } from "@/components/auth/RoleGate";
import { AuditLogsClient } from "./_components/AuditLogsClient";

/**
 * Journal d'audit — read-only viewer of every meaningful action.
 * Append-only collection populated by `lib/audit/log.ts`. Super-admin only.
 */
export default function AuditLogsPage() {
  return (
    <RouteGuard roles={["super-admin"]}>
      <AuditLogsClient />
    </RouteGuard>
  );
}
