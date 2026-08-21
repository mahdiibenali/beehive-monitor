import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";
import { MobileAlertItem, MobileFarmData, FarmHiveItem } from "../types/types";
import { CHART_LABELS } from "../utils/constants";
import { DesignChartCard } from "./DesignChartCard";
import { DesignCollectorRow } from "./DesignCollectorRow";
import { FarmGatewayStatus } from "./FarmGatewayStatus";

export function FarmBatteryTab({
      hives,
      farmData,
      alerts,
      timeFilter,
      onTimeFilterChange
    }: {
          hives: FarmHiveItem[];
          farmData?: MobileFarmData;
          alerts: MobileAlertItem[];
          timeFilter: string;
          onTimeFilterChange: (filter: string) => void;
        }) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const gatewaySerial = farmData?.gatewaySerial ?? "GW-568";
    const batteryS = Math.round(farmData?.latestBatteryS ?? 0);
    const batteryC = typeof farmData?.latestBatteryC === "number" ? farmData.latestBatteryC.toFixed(2) + "V" : "0V";
    
    return (
    <View style={styles.farmTabContent}>
      <FarmGatewayStatus gatewaySerial={gatewaySerial} />

      <View style={styles.designCollectorSection}>
        <View style={[styles.designCollectorHeader, { justifyContent: "center" }]}>
          <Text style={styles.designCollectorTitle}>BATTERIE ET CONNEXION</Text>
        </View>

        <View style={styles.designCollectorRows}>
          <DesignCollectorRow
            icon="battery-half-outline"
            label="Batterie-S"
            customValue={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 30, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 }}>
                   <View style={{ width: `${batteryS}%`, height: '100%', backgroundColor: colors.brandPurple, borderRadius: 2 }} />
                </View>
                <Text style={{ fontSize: 13, color: colors.ink500, fontWeight: "500" }}>{batteryS}%</Text>
              </View>
            }
            expanded={expandedRow === "Batterie-S"}
            onPress={() => setExpandedRow(expandedRow === "Batterie-S" ? null : "Batterie-S")}
          >
            <View style={styles.designChartInset}>
              <DesignChartCard title="Batterie-S" color={colors.brandPurple} activeFilter={timeFilter} onFilterChange={onTimeFilterChange} series={farmData?.series?.batteryS || { values: [0, 0, 0, 0, 0, 0], labels: CHART_LABELS }} emptyText="Aucune donnee disponible" />
            </View>
          </DesignCollectorRow>

          <DesignCollectorRow
            icon="battery-charging-outline"
            label="Batterie-C"
            badge={batteryC}
            badgeTone="purple"
            value={batteryC}
            expanded={expandedRow === "Batterie-C"}
            onPress={() => setExpandedRow(expandedRow === "Batterie-C" ? null : "Batterie-C")}
          >
            <View style={styles.designChartInset}>
              <DesignChartCard title="Chargement" color={colors.brandPurple} activeFilter={timeFilter} onFilterChange={onTimeFilterChange} series={farmData?.series?.batteryC || { values: [0, 0, 0, 0, 0, 0], labels: CHART_LABELS }} emptyText="Aucune donnee disponible" />
            </View>
          </DesignCollectorRow>
        </View>
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  farmTabContent: { gap: 12 },
  designCollectorSection: { borderRadius: 16, backgroundColor: colors.ink100, padding: 16, gap: 16 },
  designCollectorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  designCollectorTitle: { color: colors.ink400, fontSize: 18, fontWeight: "600", textTransform: "uppercase" },
  designCollectorRows: { gap: 8 },
  designChartInset: { paddingHorizontal: 16, paddingBottom: 16 },
});

