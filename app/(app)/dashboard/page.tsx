"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { SuperAdminDashboard } from "./_components/SuperAdminDashboard";
import { ApiculteurDashboard } from "./_components/ApiculteurDashboard";

/**
 * Dashboard — entry point shared by all roles.
 *
 * Routes by role:
 *   • super-admin → operational dashboard, full layout
 *   • admin       → operational dashboard, no "Admins connectés" card
 *   • apiculteur  → personal view (alerts + venin + map)
 */
export default function DashboardPage() {
  const { user } = useCurrentUser();

  if (user.role === "super-admin" || user.role === "admin") {
    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle={`Bienvenue ${user.name}.`}
        />
        <SuperAdminDashboard audience={user.role} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Bienvenue ${user.name}.`}
      />
      <ApiculteurDashboard />
    </>
  );
}
