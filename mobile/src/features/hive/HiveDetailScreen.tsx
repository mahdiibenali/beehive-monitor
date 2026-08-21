import React from "react";
import { StyleSheet } from "react-native";
import { HiveDetailView } from "src/shared/components/HiveDetailView";
import { HomeTopBar } from "src/shared/components/HomeTopBar";
import { EmptyState, Loading, Screen } from "src/shared/components/ui";
import { MobileFarmData, MobileHiveItem, MobileRucheDataPayload, ScreenKey } from "src/shared/types/types";
import { useEndpoint } from "src/shared/utils/helpers";

export function HiveDetailScreen({ onNavigate, selectedHiveId }: { onNavigate: (screen: ScreenKey) => void; selectedHiveId: string | null; }) {
    const { data, loading, error } = useEndpoint<MobileRucheDataPayload>("/mobile/ruche-data", [], 5000);
    const farmData = data?.farms ?? [];
    let foundHive: MobileHiveItem | undefined;
    let foundFarmData: MobileFarmData | undefined;
    for (const f of farmData) {
    const h = f.hives.find(x => x.id === selectedHiveId);
    if (h) {
      foundHive = h;
      foundFarmData = f;
      break;
    }
    }

    if (!selectedHiveId || !foundHive || !foundFarmData) {
    return (
      <Screen style={styles.venomScreen}>
        <HomeTopBar
          onBack={() => onNavigate("goBack")}
          onNotifications={() => onNavigate("notifications")}
          onProfile={() => onNavigate("profile")}
        />
        {loading ? <Loading /> : <EmptyState text="Ruche introuvable ou non selectionnee." />}
      </Screen>
    );
    }

    const hiveAlerts = (data?.alerts ?? []).filter(a => a.hiveId === selectedHiveId);
    return (
    <HiveDetailView
      hive={foundHive}
      alerts={hiveAlerts}
      farm={foundFarmData.ferme}
      farmData={foundFarmData}
      onBack={() => onNavigate("goBack")}
      onAllAlerts={() => onNavigate("maintenance")}
      onNotifications={() => onNavigate("notifications")}
      onProfile={() => onNavigate("profile")}
    />
    );
}

const styles = StyleSheet.create({
  venomScreen: {
        paddingTop: 32,
        gap: 12
      },
});

