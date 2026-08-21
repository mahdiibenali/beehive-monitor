import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { MobileAlertItem, MobileFarmData, FarmHiveItem } from "../types/types";
import { CHART_LABELS } from "../utils/constants";
import { formatMaybeNumber } from "../utils/helpers";
import { DesignChartCard } from "./DesignChartCard";
import { DesignCollectorRow } from "./DesignCollectorRow";

export function FarmVeninTab({
      hives,
      farmData,
      alerts,
      timeFilter,
      onTimeFilterChange
    }: {
          hives: FarmHiveItem[];
          farmData?: MobileFarmData;
          alerts: MobileAlertItem[];
          timeFilter?: string;
          onTimeFilterChange?: (filter: string) => void;
        }) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const productionValues = hives
            .map((hive) => hive.productionMg)
            .filter((value): value is number => typeof value === "number");
    const total = productionValues.length > 0
            ? productionValues.reduce((sum, value) => sum + value, 0)
            : null;
    const alertHive = hives.find((hive) => hive.isCritical) ?? hives[0];
    const alert = alerts.find((item) => item.hiveId === alertHive?.id) ?? alerts[0];
    const gatewayCount = farmData ? farmData.ferme.gateway : 0;
    const totalActivite = farmData?.series?.activite?.values?.reduce((a: any, b: any) => a + b, 0) || 0;
    const cablesStatus = farmData?.cablesStatus ?? "Actif";
    const cableBadge = cablesStatus === "OK" ? "Actif" : "Défaut";
    const cableTone = cablesStatus === "OK" ? "green" : "red";
    const lastTension = farmData?.series?.tension?.values?.slice(-1)[0];
    const tensionValue = formatMaybeNumber(lastTension, "V");
    return (
    <View style={styles.designVeninContent}>
      <View style={styles.designAlertsCard}>
        <View style={styles.designAlertsInner}>
          <View style={styles.designCenteredTitleRow}>
            <Ionicons name="information-circle-outline" size={18} color={colors.ink400} />
            <Text style={styles.designSectionTitle}>Derniere alertes</Text>
          </View>
          {alert ? (
            <View style={styles.designAlertItem}>
              <View style={styles.designAlertIcon}>
                <Ionicons name={alert.tone === "red" ? "git-compare-outline" : "warning-outline"} size={18} color={alert.tone === "red" ? "#AD4126" : colors.brandOrangeHover} />
              </View>
              <View style={styles.designAlertBody}>
                <Text style={styles.designAlertTitle}>{alert.title}</Text>
                <View style={styles.designMetaRow}>
                  <Ionicons name="location-outline" size={14} color={colors.ink400} />
                  <Text style={styles.designMetaText} numberOfLines={1}>
                    {alert.farmName || alertHive?.farmName || farmData?.ferme.nom || "--"}
                  </Text>
                </View>
                <View style={styles.designAlertDateRow}>
                  <View style={styles.designMetaRow}>
                    <Ionicons name="calendar-outline" size={13} color={colors.ink500} />
                    <Text style={styles.designMetaText}>{alert.date ?? "--"}</Text>
                  </View>
                  <View style={styles.designMetaRow}>
                    <Ionicons name="time-outline" size={15} color={colors.ink500} />
                    <Text style={styles.designMetaText}>{alert.time ?? "--"}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.designStatusPillGray}>
                <View style={styles.designStatusDotGray} />
                <Text style={styles.designStatusTextGray}>{alert.status}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.designNoDataBox}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.ink400} />
              <Text style={styles.designNoDataText}>Aucune alerte venin disponible</Text>
            </View>
          )}
          {alerts.length > 1 ? (
            <View style={styles.designDotsRow}>
              {alerts.slice(0, 3).map((item) => <View key={item.id} style={styles.designPagerDot} />)}
            </View>
          ) : null}
        </View>
        <Pressable style={styles.designAllAlertsButton}>
          <Text style={styles.designAllAlertsText}>Toutes les alertes</Text>
        </Pressable>
      </View>

      <View style={styles.designCollectorSection}>
        <View style={styles.designCollectorHeader}>
          <Text style={styles.designCollectorTitle}>collecteur de venin</Text>
          <View style={styles.designChevronBox}>
            <Ionicons name="chevron-up-outline" size={15} color={colors.brandPurple} />
          </View>
        </View>

        <View style={styles.designCollectorRows}>
          <DesignCollectorRow
            icon="sunny-outline"
            label="Activite"
            badge={totalActivite > 5 ? "High" : totalActivite > 2 ? "Mid" : totalActivite > 0 ? "Low" : "Aucun"}
            badgeTone={totalActivite > 5 ? "purple" : totalActivite > 2 ? "orange" : totalActivite > 0 ? "gray" : "red"}
            value={totalActivite > 0 ? `${totalActivite} Actif` : "Aucun"}
            expanded={expandedRow === "Activite"}
            onPress={() => setExpandedRow(expandedRow === "Activite" ? null : "Activite")}
          >
            <View style={styles.designChartInset}>
              <DesignChartCard title="Activite" color={colors.brandPurple} activeFilter={timeFilter} onFilterChange={onTimeFilterChange} series={farmData?.series?.activite || { values: [0, 0, 0, 0, 0, 0], labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] }} emptyText="Aucune donnee d'activite" />
            </View>
          </DesignCollectorRow>

          <DesignCollectorRow
            icon="git-compare-outline"
            label="Etat cables"
            badge={cableBadge}
            badgeTone={cableTone as any}
            danger={cableTone === "red"}
            value={cableBadge}
          />

          <DesignCollectorRow
            icon="flash-outline"
            label="Tension cables"
            badge={tensionValue}
            badgeTone="purple"
            value={tensionValue}
            expanded={expandedRow === "Tension"}
            onPress={() => setExpandedRow(expandedRow === "Tension" ? null : "Tension")}
          >
            <View style={styles.designChartInset}>
              <DesignChartCard title="Tension" color={colors.brandBlue} activeFilter={timeFilter} onFilterChange={onTimeFilterChange} series={farmData?.series?.tension ?? undefined} emptyText="Aucune donnee de tension disponible" />
            </View>
          </DesignCollectorRow>
        </View>

        <DesignChartCard 
          title="Production venin" 
          color={colors.brandOrange} 
          activeFilter={timeFilter} 
          onFilterChange={onTimeFilterChange}
          series={farmData?.series?.production ?? undefined} 
          emptyText="Aucune production venin mesuree" 
        />
      </View>

      <View style={styles.designVeninTotalBar}>
        <View>
          <Text style={styles.farmGatewayLabel}>Production totale aujourd'hui</Text>
          <Text style={styles.farmVeninTotal}>{formatMaybeNumber(total)} <Text style={styles.farmVeninUnit}>mg</Text></Text>
        </View>
        <View style={styles.farmVeninIcon}>
          <Ionicons name="water" size={26} color={colors.brandOrange} />
        </View>
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  designVeninContent: { gap: 24 },
  designAlertsCard: { borderRadius: 16, backgroundColor: colors.white, padding: 16, gap: 16, ...softShadow },
  designAlertsInner: { borderRadius: 16, backgroundColor: colors.ink100, padding: 16, gap: 16 },
  designCenteredTitleRow: { flexDirection: "row", justifyContent: "center", alignItems: "flex-start", gap: 8 },
  designSectionTitle: { color: colors.ink400, textAlign: "center", fontSize: 18, lineHeight: 20, fontWeight: "600" },
  designAlertItem: { minHeight: 78, borderRadius: 8, backgroundColor: colors.white, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 8, ...softShadow },
  designAlertIcon: { width: 46, height: 46, borderRadius: 8, backgroundColor: "#F9E7E6", alignItems: "center", justifyContent: "center" },
  designAlertBody: { flex: 1, gap: 8 },
  designAlertTitle: { color: "#AD4126", fontSize: 16, lineHeight: 20, fontWeight: "500" },
  designMetaRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  designMetaText: { flex: 1, color: colors.ink500, fontSize: 14, lineHeight: 18, fontWeight: "500" },
  designAlertDateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", opacity: 0.6 },
  designStatusPillGray: { borderRadius: 999, backgroundColor: "#D1D2DC", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4 },
  designStatusDotGray: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ink500 },
  designStatusTextGray: { color: colors.ink500, fontSize: 12, fontWeight: "500" },
  designNoDataBox: {
        paddingVertical: 32,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.white,
        borderRadius: 16,
        ...softShadow
      },
  designNoDataText: {
        color: colors.ink400,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center"
      },
  designDotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "flex-start", gap: 8 },
  designPagerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#D1D2DC" },
  designAllAlertsButton: { minHeight: 60, borderRadius: 30, backgroundColor: "#808EE7", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 18, ...softShadow },
  designAllAlertsText: { color: colors.white, textAlign: "center", fontSize: 18, lineHeight: 20, fontWeight: "500" },
  designCollectorSection: { borderRadius: 16, backgroundColor: colors.ink100, padding: 16, gap: 16 },
  designCollectorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  designCollectorTitle: { color: colors.ink400, fontSize: 18, fontWeight: "600", textTransform: "uppercase" },
  designChevronBox: { borderRadius: 4, backgroundColor: colors.ink200, padding: 2 },
  designCollectorRows: { gap: 8 },
  designChartInset: { paddingHorizontal: 16, paddingBottom: 16 },
  designVeninTotalBar: { borderRadius: 18, backgroundColor: colors.white, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", ...softShadow },
  farmGatewayLabel: { color: colors.ink400, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  farmVeninTotal: { color: colors.ink800, fontSize: 28, fontWeight: "900" },
  farmVeninUnit: { color: colors.ink400, fontSize: 16, fontWeight: "800" },
  farmVeninIcon: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.accent100, alignItems: "center", justifyContent: "center" },
});

