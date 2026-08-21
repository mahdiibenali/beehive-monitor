"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

/**
 * Notifications — accessible to every role.
 */
export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Vos alertes et notifications."
      />
      <Card className="p-6">
        <p className="text-sm text-ink-500">Aucune notification pour le moment.</p>
      </Card>
    </>
  );
}
