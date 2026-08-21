import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { AttentionBanner } from "src/shared/components/AttentionBanner";
import { DesignLineChart } from "src/shared/components/DesignLineChart";
import { HomeStatTile } from "src/shared/components/HomeStatTile";
import { HomeTopBar } from "src/shared/components/HomeTopBar";
import { LatestAlertsPanel } from "src/shared/components/LatestAlertsPanel";
import { MapExplorerView } from "src/shared/components/MapExplorerView";
import { TunisiaMapCard } from "src/shared/components/TunisiaMapCard";
import { ErrorBanner, Loading, Screen } from "src/shared/components/ui";
import { colors, softShadow } from "src/shared/theme/theme";
import { MobileRucheDataPayload, ScreenKey, HomeAlertItem, MapStatusFilter } from "src/shared/types/types";
import { CHART_LABELS, CHART_VALUES, TIME_FILTERS } from "src/shared/utils/constants";
import { useEndpoint } from "src/shared/utils/helpers";

export function FermesScreen({ onNavigate }: { onNavigate: (screen: ScreenKey) => void }) {
    const [selectedFarm, setSelectedFarm] = useState("Tous");
    const [mapOpen, setMapOpen] = useState(false);
    const [mapSearch, setMapSearch] = useState("");
    const [mapStatusFilter, setMapStatusFilter] = useState<MapStatusFilter>("Critique");
  const [activeTimeFilter, setActiveTimeFilter] = useState<(typeof TIME_FILTERS)[number]>("1M");
  const { data, loading, error, reload } = useEndpoint<MobileRucheDataPayload>(`/mobile/ruche-data?filter=${activeTimeFilter}`, [activeTimeFilter], 5000);
  const notifications = useEndpoint<{ items: any[]; unreadCount: number }>("/notifications?limit=5");
  const farms = data?.farms ?? [];
  const fermes = farms.map((f) => f.ferme);
  const alerts = data?.alerts ?? [];
  const stats = useMemo(() => {
    const ruches = fermes.reduce((sum, ferme) => sum + ferme.ruches, 0);
    const gateways = fermes.reduce((sum, ferme) => sum + ferme.gateway, 0);
    const attention = alerts.length;
    return { fermes: fermes.length, ruches, gateways, attention };
  }, [fermes, alerts]);
  const hasData = stats.fermes > 0;
  const harvestGrams = hasData ? Math.max(1, Math.round((stats.ruches * 120 + stats.gateways * 40) / 100)) : 0;
  const alertRows = useMemo<HomeAlertItem[]>(() => {
    return alerts.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      location: item.farmName,
      date: item.date ?? "--",
      time: item.time ?? "--",
      status: item.status,
      tone: item.tone,
    }));
  }, [alerts]);
  const chartSeries = useMemo(() => {
    if (data?.globalSeries?.production) return data.globalSeries.production;
    return { values: CHART_VALUES, labels: CHART_LABELS };
  }, [data?.globalSeries]);

  if (mapOpen) {
    return (
      <MapExplorerView
        fermes={fermes}
        loading={loading}
        error={error}
        search={mapSearch}
        onSearch={setMapSearch}
        statusFilter={mapStatusFilter}
        onStatusFilter={setMapStatusFilter}
        onBack={() => setMapOpen(false)}
        onNotifications={() => onNavigate("notifications")}
        onProfile={() => onNavigate("profile")}
      />
    );
  }

  return (
    <Screen style={styles.homeScreen}>
      <HomeTopBar
        onRefresh={reload}
        onNotifications={() => onNavigate("notifications")}
        onProfile={() => onNavigate("profile")}
        hasNotifications={stats.attention > 0 || (notifications.data?.unreadCount ?? 0) > 0}
      />
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.homeStatsPanel}>
        <HomeStatTile
          label="Fermes"
          value={hasData ? String(stats.fermes).padStart(2, "0") : "--"}
          icon="business-outline"
        />
        <HomeStatTile
          label="Ruches"
          value={hasData ? stats.ruches : "--"}
          icon="layers-outline"
        />
        <HomeStatTile
          label="Récoltes"
          value={hasData ? harvestGrams : "--"}
          unit="g"
          subtitle={hasData ? "+4 ce mois" : undefined}
          icon="water-outline"
          wide
        />
      </View>

      <AttentionBanner count={stats.attention} onPress={() => onNavigate("notifications")} />

      <View style={[styles.homeProductionCard, !hasData && styles.homeEmptyFade]}>
        <View style={styles.productionHeader}>
          <Text style={styles.productionTitle}>Production venin</Text>
          <Text style={styles.productionDate}>04-06 Mai 2026</Text>
        </View>
        <View style={styles.timeFilterRow}>
          {TIME_FILTERS.map((filter) => (
            <Pressable key={filter} onPress={() => setActiveTimeFilter(filter)} style={[styles.timeTab, activeTimeFilter === filter && styles.timeTabActive]}>
              <Text style={[styles.timeTabText, activeTimeFilter === filter && styles.timeTabTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ marginHorizontal: -12, marginTop: 8 }}>
          <DesignLineChart color={colors.brandOrange} series={hasData ? chartSeries : { values: [0, 0, 0, 0, 0, 0], labels: CHART_LABELS }} />
        </View>
      </View>

      <TunisiaMapCard
        fermes={fermes}
        selectedFarm={selectedFarm}
        onSelectFarm={setSelectedFarm}
        onOpen={() => setMapOpen(true)}
      />

      <LatestAlertsPanel alerts={hasData ? alertRows : []} onViewAll={() => onNavigate("notifications")} />
    </Screen>
    );
}

const styles = StyleSheet.create({
  homeScreen: {
        paddingTop: 32,
        gap: 12
      },
  homeStatsPanel: {
        backgroundColor: "#ECEEF9",
        borderRadius: 14,
        padding: 8,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
      },
  homeProductionCard: {
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 14,
        gap: 10,
        ...softShadow
      },
  homeEmptyFade: {
        opacity: 0.42
      },
  productionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
      },
  productionTitle: {
        color: colors.ink800,
        fontSize: 16,
        lineHeight: 20,
        fontWeight: "800"
      },
  productionDate: {
        color: colors.ink400,
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "700"
      },
  timeFilterRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
      },
  timeTab: {
        minHeight: 28,
        paddingHorizontal: 12,
        borderRadius: 7,
        backgroundColor: colors.primary100,
        alignItems: "center",
        justifyContent: "center"
      },
  timeTabActive: {
        backgroundColor: colors.brandPurple
      },
  timeTabText: {
        color: colors.brandPurple,
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "800"
      },
  timeTabTextActive: {
        color: colors.white
      },
});

