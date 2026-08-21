import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AddVeninModal } from "src/shared/components/AddVeninModal";
import { DesignLineChart } from "src/shared/components/DesignLineChart";
import { HiveFilter } from "src/shared/components/HiveFilter";
import { EmptyState, ErrorBanner, Loading, Screen } from "src/shared/components/ui";
import { VenomHiveCard } from "src/shared/components/VenomHiveCard";
import { VenomStatCard } from "src/shared/components/VenomStatCard";
import { colors, shadow, softShadow } from "src/shared/theme/theme";
import { MobileRucheDataPayload, ScreenKey, VenomHiveItem } from "src/shared/types/types";
import { CHART_LABELS, CHART_VALUES, HIVE_FILTERS, TIME_FILTERS } from "src/shared/utils/constants";
import { formatMg, useEndpoint } from "src/shared/utils/helpers";

export function FermeDashboardScreen({ onNavigate, initialFarmId }: { onNavigate: (screen: ScreenKey, payload?: string) => void; initialFarmId?: string | null }) {
    const [activeTimeFilter, setActiveTimeFilter] = useState<(typeof TIME_FILTERS)[number]>("1M");
    const [selectedHiveFilter, setSelectedHiveFilter] = useState<HiveFilter>("Tous");
    const [search, setSearch] = useState("");
    const { data, loading, error, reload } = useEndpoint<MobileRucheDataPayload>(`/mobile/ruche-data?filter=${activeTimeFilter}`, [activeTimeFilter]);
    const [modalVisible, setModalVisible] = useState(false);
    const farms = data?.farms ?? [];
    const selectedFarmData = farms.find(f => f.ferme.id === initialFarmId) ?? farms[0];
    const ferme = selectedFarmData?.ferme;
    const hives = selectedFarmData?.hives ?? [];
    const alerts = data?.alerts ?? [];
    const farmAlerts = alerts.filter(a => hives.some(h => h.id === a.hiveId));
    const stats = useMemo(() => {
            return { 
              ruches: ferme?.ruches ?? 0, 
              attention: farmAlerts.length 
            };
          }, [ferme, farmAlerts]);
    const activeCollectors = selectedFarmData?.collecteursActifs ?? 0;
    const chartSeries = useMemo(() => {
            if (selectedFarmData?.series?.production) return selectedFarmData.series.production;
            return { values: CHART_VALUES, labels: CHART_LABELS };
          }, [selectedFarmData?.series]);
    const totalMg = useMemo(() => {
            if (selectedFarmData?.series?.production) {
              return selectedFarmData.series.production.values.reduce((sum, val) => sum + val, 0);
            }
            return 0;
          }, [selectedFarmData?.series]);
    const venomHives = useMemo<VenomHiveItem[]>(() => {
            return hives.map((hive) => {
              return {
                id: hive.id,
                name: hive.name,
                farm: ferme?.nom ?? "",
                isActive: hive.batteryS !== null,
                isAlert: hive.isCritical,
                collected: `${hive.productionMg || 0} mg`,
                plaque: `${hive.plaque || 0}`,
                lastDate: hive.lastDate || "----"
              };
            });
          }, [hives, ferme]);
    const filteredHives = useMemo(() => {
            const query = search.trim().toLowerCase();
            return venomHives.filter((hive) => {
              const matchesSearch =
                !query ||
                hive.name.toLowerCase().includes(query);
              if (!matchesSearch) return false;
              if (selectedHiveFilter === "Active") return hive.isActive && !hive.isAlert;
              if (selectedHiveFilter === "Désactivé") return !hive.isActive;
              if (selectedHiveFilter === "Alerte") return hive.isAlert;
              return true;
            });
          }, [search, selectedHiveFilter, venomHives]);
    return (
    <View style={{ flex: 1 }}>
      <Screen scroll={false} style={[styles.venomScreen, { gap: 0, paddingBottom: 24, flex: 1 }]}>
        <View style={[styles.venomTopBar, { marginBottom: 16 }]}>
          <Pressable style={styles.venomLogo} onPress={() => onNavigate("goBack")}>
            <Ionicons name="arrow-back" size={25} color={colors.white} />
          </Pressable>
          <View style={styles.venomTopActions}>
            <Pressable style={styles.topCircle} onPress={() => onNavigate("notifications")}>
              <Ionicons name="notifications-outline" size={20} color={colors.brandPurple} />
              <View style={styles.notificationDot} />
            </Pressable>
            <Pressable style={styles.topCircle} onPress={() => onNavigate("profile")}>
              <Ionicons name="person-outline" size={20} color={colors.brandPurple} />
            </Pressable>
          </View>
        </View>
        
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBanner message={error} /> : null}

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.venomStatsGrid}>
          <View style={styles.venomStatsRow}>
          <VenomStatCard
            label="Collecteurs actifs"
            labelColor={colors.ink400}
            value={`${activeCollectors}/${stats.ruches || 0}`}
          />
          <VenomStatCard
            label="Collecté"
            labelColor={colors.ink400}
            value={formatMg(totalMg)}
            unit="mg"
          />
        </View>
        <View style={styles.venomStatsRow}>
          <VenomStatCard
            label="Alertes"
            labelColor={colors.brandOrangeHover}
            value={stats.attention}
            alert={stats.attention > 0}
          />
          <VenomStatCard
            label="Tension critique"
            labelColor={colors.ink400}
            value="04"
            alert
          />
        </View>
      </View>

      <View style={styles.productionCard}>
        <View style={styles.productionHeader}>
          <Text style={styles.productionTitle}>Production {ferme?.nom ?? ""}</Text>
          <Text style={styles.productionDate}>Aujourd'hui</Text>
        </View>
        <View style={styles.timeFilterRow}>
          {TIME_FILTERS.map((filter) => {
            const active = activeTimeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveTimeFilter(filter)}
                style={[styles.timeTab, active && styles.timeTabActive]}
              >
                <Text style={[styles.timeTabText, active && styles.timeTabTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ marginHorizontal: -12, marginTop: 8 }}>
          <DesignLineChart color={colors.brandOrange} series={chartSeries} />
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.venomSearch}>
            <Ionicons name="search-outline" size={16} color={colors.ink400} />
            <TextInput
              placeholder="Ruches..."
              placeholderTextColor={colors.ink400}
              value={search}
              onChangeText={setSearch}
              style={styles.venomSearchInput}
            />
          </View>
        </View>
        <View style={styles.filterRow}>
          {HIVE_FILTERS.map((filter) => {
            const active = selectedHiveFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedHiveFilter(filter)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
          <View style={styles.calendarChip}>
            <Ionicons name="calendar-outline" size={16} color={colors.brandPurple} />
          </View>
        </View>
      </View>

      <View style={styles.hiveList}>
        {filteredHives.length === 0 && !loading ? (
          <EmptyState text="Aucune ruche trouvée." />
        ) : null}
        {filteredHives.map((hive) => (
          <VenomHiveCard
            key={hive.id}
            item={hive}
            onPress={() => onNavigate("hive", hive.id)}
          />
        ))}
      </View>
      </ScrollView>
    </Screen>

    <Pressable
      onPress={() => setModalVisible(true)}
      style={styles.fab}
    >
      <Ionicons name="add" size={28} color={colors.white} />
    </Pressable>

    <AddVeninModal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      farmId={ferme?.id || ""}
      gatewayId={selectedFarmData?.gatewaySerial || ""}
      hives={venomHives}
      onSuccess={reload}
    />
    </View>
    );
}

const styles = StyleSheet.create({
  venomScreen: {
        paddingTop: 32,
        gap: 12
      },
  venomTopBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6
      },
  venomLogo: {
        width: 46,
        height: 46,
        borderRadius: 15,
        backgroundColor: colors.brandOrange,
        alignItems: "center",
        justifyContent: "center",
        ...softShadow
      },
  venomTopActions: {
        flexDirection: "row",
        gap: 12
      },
  topCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
        ...softShadow
      },
  notificationDot: {
        position: "absolute",
        top: 10,
        right: 11,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.danger,
        borderWidth: 1.5,
        borderColor: colors.white
      },
  venomStatsGrid: {
        backgroundColor: "#ECEEF9",
        borderRadius: 14,
        padding: 8,
        gap: 8
      },
  venomStatsRow: {
        flexDirection: "row",
        gap: 8
      },
  productionCard: {
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 14,
        gap: 10,
        ...softShadow
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
  searchSection: {
        gap: 8
      },
  searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
      },
  venomSearch: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#ECEEF9",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        gap: 8
      },
  venomSearchInput: {
        flex: 1,
        height: 44,
        color: colors.ink700,
        fontSize: 12,
        fontWeight: "700",
        padding: 0
      },
  filterRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6
      },
  filterChip: {
        minHeight: 28,
        borderRadius: 14,
        backgroundColor: colors.primary100,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center"
      },
  filterChipActive: {
        backgroundColor: colors.brandPurple
      },
  filterChipText: {
        color: colors.brandPurple,
        fontSize: 11,
        fontWeight: "800"
      },
  filterChipTextActive: {
        color: colors.white
      },
  calendarChip: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.primary100,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: "auto"
      },
  hiveList: {
        gap: 12
      },
  fab: {
    position: "absolute",
    bottom: 110,
    right: 30,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandPurple,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
    zIndex: 999,
    elevation: 999,
  },
});