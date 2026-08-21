import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { FermeListItem, MobileFarmData, FarmHiveItem, HiveAlertItem } from "../types/types";
import { TIME_FILTERS } from "../utils/constants";
import { formatMaybeNumber, shortFarmName } from "../utils/helpers";
import { AlertRow } from "./AlertRow";
import { ConditionRow } from "./ConditionRow";
import { DesignLineChart } from "./DesignLineChart";
import { HomeTopBar } from "./HomeTopBar";
import { EmptyState, Screen } from "./ui";

export function HiveDetailView({
      hive,
      alerts,
      farm,
      farmData,
      onBack,
      onAllAlerts,
      onNotifications,
      onProfile
    }: {
          hive?: FarmHiveItem;
          alerts: HiveAlertItem[];
          farm?: FermeListItem;
          farmData?: MobileFarmData;
          onBack: () => void;
          onAllAlerts: () => void;
          onNotifications: () => void;
          onProfile: () => void;
        }) {

    const [expandedRow, setExpandedRow] = useState<string | null>("Pression");
    const [chartTimeFilter, setChartTimeFilter] = useState<(typeof TIME_FILTERS)[number]>("Cette semaine");
    
    const [realSeries, setRealSeries] = useState<any>(null);
    React.useEffect(() => {
      if (!hive?.id) return;
      let alive = true;
      // Use standard fetch since useEndpoint is tricky to import mid-file without path aliases
      fetch(`/api/mobile/hive-charts?hiveId=${hive.id}&filter=${chartTimeFilter}`)
        .then(r => r.json())
        .then(d => { if (alive) setRealSeries(d); })
        .catch(() => {});
      return () => { alive = false; };
    }, [hive?.id, chartTimeFilter]);

    const fakeSeries = useMemo(() => {
      const modifier = chartTimeFilter === "1M" ? 10 : chartTimeFilter === "3M" ? -10 : chartTimeFilter === "6M" ? 5 : 0;
      return {
        labels: ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun"],
        values: [20, 18, 22, 35, 60, 40].map(v => v + modifier + (Math.random() * 5))
      };
    }, [chartTimeFilter, expandedRow]);

    const renderAccordion = (
      key: string,
      icon: any,
      label: string,
      badge: string,
      tone: "red" | "orange" | "plain"
    ) => {
      const isExpanded = expandedRow === key;
      const activeSeries = key === "Pression" && realSeries?.pressure ? realSeries.pressure : fakeSeries;

      if (isExpanded) {
        return (
          <View key={key} style={styles.pressurePanel}>
            <Pressable onPress={() => setExpandedRow(null)} style={styles.pressureHeader}>
              <ConditionRow icon={icon} label={label} badge={badge} tone={tone} compact expanded={true} />
            </Pressable>
            <View style={styles.productionHeader}>
              <Text style={styles.productionTitle}>{label}</Text>
              <Text style={styles.productionDate}>04-06 Mai 2026</Text>
            </View>
            <View style={styles.timeFilterRow}>
              {TIME_FILTERS.map((time) => {
                const active = chartTimeFilter === time;
                return (
                  <Pressable key={time} onPress={() => setChartTimeFilter(time)} style={[styles.timeTab, active && styles.timeTabActive]}>
                    <Text style={[styles.timeTabText, active && styles.timeTabTextActive]}>{time}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ marginHorizontal: -12, marginTop: 8 }}>
              <DesignLineChart color={tone === "red" ? colors.danger : tone === "orange" ? colors.brandOrange : colors.brandPurple} series={activeSeries} />
            </View>
          </View>
        );
      }

      return (
        <Pressable key={key} onPress={() => setExpandedRow(key)}>
          <ConditionRow icon={icon} label={label} badge={badge} tone={tone} expanded={false} />
        </Pressable>
      );
    };

    return (
    <Screen style={styles.alertScreen}>
      <HomeTopBar
        onBack={onBack}
        onNotifications={onNotifications}
        onProfile={onProfile}
        hasNotifications={alerts.some((alert) => alert.status !== "Resolue")}
      />
      <View style={styles.alertBreadcrumb}>
        <View style={styles.alertBreadcrumbIcon}>
          <Ionicons name="cube-outline" size={14} color={colors.brandPurple} />
        </View>
        <Text style={styles.alertBreadcrumbText} numberOfLines={1}>
          Ruche  &gt;  {shortFarmName(farm?.nom ?? hive?.farmName ?? "--")}
        </Text>
        <Pressable style={styles.alertLocationMini}>
          <Ionicons name="location" size={15} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.collectorDisabledCard}>
        <View style={styles.collectorDisabledDot} />
        <Text style={styles.collectorDisabledText}>Collecteur desactive</Text>
        <View style={styles.collectorDisabledPill}>
          <Text style={styles.collectorDisabledPillText}>Desactive</Text>
        </View>
      </View>

      <View style={styles.detailAlertsPanel}>
        <View style={styles.detailPanelTitleRow}>
          <Ionicons name="information-circle-outline" size={15} color={colors.ink400} />
          <Text style={styles.detailPanelTitle}>Derniere alertes</Text>
        </View>
        {(alerts || []).slice(0, 1).map((alert) => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
        {(!alerts || alerts.length === 0) ? <EmptyState text="Aucune alerte." /> : null}
        <Pressable style={styles.alertConsultButton} onPress={onAllAlerts}>
          <Text style={styles.alertConsultText}>Toutes les alertes</Text>
        </Pressable>
      </View>

      <View style={styles.conditionsCard}>
        <Text style={styles.conditionsTitle}>CONDITIONS INTERNES</Text>
        <View style={styles.queenCard}>
          <View style={styles.alertCollectorDot} />
          <Text style={styles.queenText}>Reine enceinte</Text>
        </View>
        <View style={styles.conditionGrid}>
          <View style={[styles.conditionTile, styles.conditionTileDanger]}>
            <View style={styles.conditionTileTop}>
              <Text style={styles.conditionLabel}>Temperature</Text>
              <Ionicons name="thermometer-outline" size={14} color={colors.danger} />
            </View>
            <Text style={[styles.conditionValue, styles.conditionValueDanger]}>{formatMaybeNumber(hive?.temperatureC, "°")}</Text>
          </View>
          <View style={styles.conditionTile}>
            <View style={styles.conditionTileTop}>
              <Text style={styles.conditionLabel}>Humidite</Text>
              <Ionicons name="water-outline" size={14} color={colors.brandPurple} />
            </View>
            <Text style={styles.conditionValue}>{formatMaybeNumber(hive?.humidityPct, "%")}</Text>
          </View>
        </View>

        {renderAccordion("Anomalies", "sync-outline", "Anomalies", "Anormal", "red")}
        {renderAccordion("Mouvement", "flash-outline", "Mouvement", "Faible", "orange")}
        {renderAccordion("Pression", "snow-outline", "Pression", formatMaybeNumber(hive?.pressureHpa, " hPa"), "plain")}
        {renderAccordion("Vitesse abeilles", "speedometer-outline", "Vitesse abeilles", formatMaybeNumber(hive?.beeSpeedMs, " m/s"), "plain")}
      </View>
    </Screen>
    );
}

const styles = StyleSheet.create({
  alertScreen: { paddingTop: 32, gap: 12, paddingBottom: 60 },
  alertBreadcrumb: { minHeight: 42, borderRadius: 12, backgroundColor: colors.primary100, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10 },
  alertBreadcrumbIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  alertBreadcrumbText: { flex: 1, color: colors.brandPurple, fontSize: 11, fontWeight: "900" },
  alertLocationMini: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.brandPurple, alignItems: "center", justifyContent: "center" },
  collectorDisabledCard: { minHeight: 58, borderRadius: 15, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, ...softShadow },
  collectorDisabledDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ink400 },
  collectorDisabledText: { flex: 1, color: colors.ink400, fontSize: 12, fontWeight: "900" },
  collectorDisabledPill: { borderRadius: 12, backgroundColor: colors.ink100, paddingHorizontal: 8, paddingVertical: 5 },
  collectorDisabledPillText: { color: colors.ink500, fontSize: 8, fontWeight: "900" },
  detailAlertsPanel: { borderRadius: 16, backgroundColor: colors.white, padding: 12, gap: 10, ...softShadow },
  detailPanelTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  detailPanelTitle: { color: colors.ink400, fontSize: 12, fontWeight: "800" },
  alertConsultButton: { height: 44, borderRadius: 22, backgroundColor: colors.brandPurple, alignItems: "center", justifyContent: "center" },
  alertConsultText: { color: colors.white, fontSize: 12, fontWeight: "900" },
  conditionsCard: { borderRadius: 18, backgroundColor: colors.white, padding: 12, gap: 10, ...softShadow },
  conditionsTitle: { textAlign: "center", color: colors.ink400, fontSize: 11, fontWeight: "900" },
  queenCard: { minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.brandPurple, backgroundColor: colors.primary100, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  alertCollectorDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brandPurple },
  queenText: { color: colors.brandPurple, fontSize: 12, fontWeight: "900" },
  conditionGrid: { flexDirection: "row", gap: 8 },
  conditionTile: { flex: 1, minHeight: 72, borderRadius: 12, backgroundColor: colors.primary100, padding: 10, gap: 6 },
  conditionTileDanger: { borderWidth: 1.5, borderColor: colors.danger, backgroundColor: "#FFF2EF" },
  conditionTileTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  conditionLabel: { color: colors.ink400, fontSize: 10, fontWeight: "800" },
  conditionValue: { color: colors.ink700, fontSize: 24, fontWeight: "900" },
  conditionValueDanger: { color: colors.danger },
  pressurePanel: { borderRadius: 14, borderWidth: 1.5, borderColor: colors.brandOrange, padding: 10, gap: 8 },
  pressureHeader: { marginBottom: -4 },
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
