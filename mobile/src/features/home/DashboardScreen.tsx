import React from "react";
import { ApiculteurDashboard } from "src/shared/components/ApiculteurDashboard";
import { ScreenKey } from "src/shared/types/types";

export function DashboardScreen({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
    return <ApiculteurDashboard onNavigate={onNavigate} />;
}
