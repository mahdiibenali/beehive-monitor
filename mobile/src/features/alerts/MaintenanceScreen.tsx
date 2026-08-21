import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AlertFilterRow } from "src/shared/components/AlertFilterRow";
import { AlertHiveCard } from "src/shared/components/AlertHiveCard";
import { AllAlertsView } from "src/shared/components/AllAlertsView";
import { AttentionBanner } from "src/shared/components/AttentionBanner";
import { HiveDetailView } from "src/shared/components/HiveDetailView";
import { HomeTopBar } from "src/shared/components/HomeTopBar";
import { TunisiaMapCard } from "src/shared/components/TunisiaMapCard";
import { EmptyState, ErrorBanner, Loading, Screen } from "src/shared/components/ui";
import { colors, shadow, softShadow } from "src/shared/theme/theme";
import { MobileRucheDataPayload, ScreenKey, AlertStatusFilter, AlertViewMode, FarmHiveItem } from "src/shared/types/types";
import { useEndpoint } from "src/shared/utils/helpers";

export function MaintenanceScreen({ onNavigate }: { onNavigate?: (screen: ScreenKey) => void }) {
    const { data, loading, error, reload } = useEndpoint<MobileRucheDataPayload>("/mobile/ruche-data");
    const farmData = data?.farms ?? [];
    const fermes = farmData.map((item: any) => item.ferme);
    const [mode, setMode] = useState<AlertViewMode>("overview");
    const [selectedFarmId, setSelectedFarmId] = useState("");
    const [selectedHiveId, setSelectedHiveId] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<AlertStatusFilter>("Tous");
    useEffect(() => {
    if (!selectedFarmId && fermes[0]) setSelectedFarmId(fermes[0].id);
    }, [fermes, selectedFarmId]);
    const selectedFarmData = farmData.find((item: any) => item.ferme.id === selectedFarmId) ?? farmData[0];
    const selectedFarm = selectedFarmData?.ferme ?? fermes[0];
    const hives = selectedFarmData?.hives ?? [];
    const alerts = data?.alerts ?? [];
    const selectedHive = hives.find((hive: any) => hive.id === selectedHiveId) ?? hives[0];
    const selectedHiveAlerts = alerts.filter((alert: any) => alert.hiveId === selectedHive?.id);
    const visibleAlerts = alerts.filter((alert: any) => filter === "Tous" || alert.status === filter);
    const visibleHives = hives.filter((hive: any) => {
            const query = search.trim().toLowerCase();
            return !query || hive.name.toLowerCase().includes(query) || hive.farmName.toLowerCase().includes(query);
          });
    const attentionCount = Math.max(
            selectedFarm?.ruchesAttention ?? 0,
            alerts.filter((alert: any) => alert.status !== "Resolue").length
          );

    function openHive(hive: FarmHiveItem) {
        setSelectedHiveId(hive.id);
        setMode("detail");
    }

    if (mode === "detail") {
    return (
      <HiveDetailView
        hive={selectedHive}
        alerts={selectedHiveAlerts}
        farm={selectedFarm}
        farmData={selectedFarmData}
        onBack={() => setMode("overview")}
        onAllAlerts={() => setMode("all")}
        onNotifications={() => onNavigate?.("notifications")}
        onProfile={() => onNavigate?.("profile")}
      />
    );
    }

    if (mode === "all") {
    return (
      <AllAlertsView
        alerts={visibleAlerts}
        filter={filter}
        onFilter={setFilter}
        onBack={() => setMode("overview")}
        onOpen={(alert: any) => {
          setSelectedHiveId(alert.hiveId);
          setMode("detail");
        }}
        onNotifications={() => onNavigate?.("notifications")}
        onProfile={() => onNavigate?.("profile")}
      />
    );
    }

    return (
    <Screen style={styles.alertScreen}>
      <HomeTopBar
        onRefresh={reload}
        onNotifications={() => onNavigate?.("notifications")}
        onProfile={() => onNavigate?.("profile")}
        hasNotifications={attentionCount > 0}
      />
      {loading ? <Loading /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.alertMapStack}>
        <TunisiaMapCard
          fermes={selectedFarm ? [selectedFarm] : fermes}
          selectedFarm="Tous"
          onSelectFarm={() => undefined}
          onOpen={() => undefined}
        />
        <AttentionBanner count={attentionCount || hives.length} onPress={() => setMode("all")} />
        <View style={styles.alertCollectorCard}>
          <View style={styles.alertCollectorDot} />
          <Text style={styles.alertCollectorText}>Collecteurs en marche</Text>
          <View style={styles.alertCollectorBadge}>
            <Text style={styles.alertCollectorBadgeText}>{selectedFarmData?.collecteursActifs ?? "--"} Active</Text>
          </View>
        </View>
      </View>

      <View style={styles.alertSearchBox}>
        <Ionicons name="search-outline" size={15} color={colors.ink400} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Recherche une ruche..."
          placeholderTextColor={colors.ink400}
          style={styles.alertSearchInput}
        />
        <Pressable style={styles.alertSearchIconButton} onPress={() => setMode("all")}>
          <Ionicons name="options-outline" size={15} color={colors.brandPurple} />
        </Pressable>
      </View>

      <AlertFilterRow filter={filter} onFilter={setFilter} />

      <View style={styles.alertHiveList}>
        {visibleHives.length === 0 ? <EmptyState text="Aucune ruche trouvee." /> : null}
        {visibleHives.map((hive: any) => (
          <AlertHiveCard
            key={hive.id}
            hive={hive}
            alerts={alerts.filter((alert: any) => alert.hiveId === hive.id)}
            onPress={() => openHive(hive)}
          />
        ))}
      </View>

      <Pressable style={styles.alertFab} onPress={() => setMode("all")}>
        <Ionicons name="add" size={24} color={colors.white} />
      </Pressable>
    </Screen>
    );
}

const styles = StyleSheet.create({
  alertScreen: { paddingTop: 32, gap: 12 },
  alertMapStack: { gap: 10 },
  alertCollectorCard: { minHeight: 46, borderRadius: 14, borderWidth: 1.5, borderColor: colors.brandPurple, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, ...softShadow },
  alertCollectorDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brandPurple },
  alertCollectorText: { flex: 1, color: colors.brandPurple, fontSize: 12, fontWeight: "900" },
  alertCollectorBadge: { borderRadius: 11, backgroundColor: colors.primary100, paddingHorizontal: 8, paddingVertical: 4 },
  alertCollectorBadgeText: { color: colors.brandPurple, fontSize: 8, fontWeight: "900" },
  alertSearchBox: { height: 42, borderRadius: 21, backgroundColor: colors.white, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8, ...softShadow },
  alertSearchInput: { flex: 1, height: 42, color: colors.ink700, fontSize: 12, fontWeight: "700", padding: 0 },
  alertSearchIconButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary100, alignItems: "center", justifyContent: "center" },
  alertHiveList: { gap: 10 },
  alertFab: { alignSelf: "flex-end", width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandPurple, alignItems: "center", justifyContent: "center", ...shadow },
});
