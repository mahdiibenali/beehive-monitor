import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { MobileRucheDataPayload, ScreenKey } from "../types/types";
import { CHART_LABELS, CHART_VALUES, TIME_FILTERS } from "../utils/constants";
import { formatMg, useEndpoint } from "../utils/helpers";
import { DesignLineChart } from "./DesignLineChart";
import { FermeAccordionCard } from "./FermeAccordionCard";
import { EmptyState, ErrorBanner, Loading, Screen } from "./ui";
import { VenomStatCard } from "./VenomStatCard";

export function ApiculteurDashboard({ onNavigate }: { onNavigate: (screen: ScreenKey, payload?: string) => void }) {
    const [activeTimeFilter, setActiveTimeFilter] = useState<(typeof TIME_FILTERS)[number]>("1M");
    const [search, setSearch] = useState("");
    const { data, loading, error, reload } = useEndpoint<MobileRucheDataPayload>(`/mobile/ruche-data?filter=${activeTimeFilter}`, [activeTimeFilter], 5000);
    const farms = data?.farms ?? [];
    const fermes = farms.map((f: any) => f.ferme);
    const alerts = data?.alerts ?? [];
    const stats = useMemo(() => {
            const ruches = fermes.reduce((sum: any, ferme: any) => sum + ferme.ruches, 0);
            const gateways = fermes.reduce((sum: any, ferme: any) => sum + ferme.gateway, 0);
            const attention = alerts.length;
            return { ruches, gateways, attention, fermes: fermes.length };
          }, [fermes, alerts]);
    const activeCollectors = farms.reduce((sum: any, f: any) => sum + (f.collecteursActifs || 0), 0);
    const chartSeries = useMemo(() => {
            if (data?.globalSeries?.production) return data.globalSeries.production;
            return { values: CHART_VALUES, labels: CHART_LABELS };
          }, [data?.globalSeries]);
    const totalMg = useMemo(() => {
            if (data?.globalSeries?.production) {
              return data.globalSeries.production.values.reduce((sum: any, val: any) => sum + val, 0);
            }
            return 0;
          }, [data?.globalSeries]);
    const filteredFermes = useMemo(() => {
            const query = search.trim().toLowerCase();
            return fermes.filter((ferme: any) => {
              const matchesSearch =
                !query ||
                ferme.nom.toLowerCase().includes(query) ||
                ferme.region.toLowerCase().includes(query);
              return matchesSearch;
            });
          }, [search, fermes]);
    const [modalVisible, setModalVisible] = useState(false);
    return (
    <View style={{ flex: 1 }}>
      <Screen scroll={false} style={[styles.venomScreen, { gap: 0, flex: 1, paddingBottom: 0 }]}>
      <View style={[styles.venomTopBar, { marginBottom: 16 }]}>
        <Pressable style={styles.venomLogo} onPress={reload}>
          <Image source={require("../../../assets/images/logo.png")} style={{ width: 46, height: 46, borderRadius: 15 }} />
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
            label="Collecté ce mois"
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
          <Text style={styles.productionTitle}>Production venin</Text>
          <Text style={styles.productionDate}>04-06 Mai 2026</Text>
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
              placeholder="Fermes..."
              placeholderTextColor={colors.ink400}
              value={search}
              onChangeText={setSearch}
              style={styles.venomSearchInput}
            />
          </View>
        </View>
      </View>

      <View style={styles.farmAccordionList}>
        {filteredFermes.length === 0 && !loading ? (
          <EmptyState text="Aucune ferme trouvée." />
        ) : null}
        {filteredFermes.map((f: any) => (
          <FermeAccordionCard key={f.id} ferme={f} onConsult={() => onNavigate("fermeDashboard", f.id)} />
        ))}
      </View>
      </ScrollView>
    </Screen>
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
  farmAccordionList: {
        gap: 12
      },
});
