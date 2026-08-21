import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { FarmHiveItem, HiveAlertItem } from "../../shared/types/types";

export function AlertHiveCard({
      hive,
      alerts,
      onPress
    }: {
          hive: FarmHiveItem;
          alerts: HiveAlertItem[];
          onPress: () => void;
        }) {
    const activeAlerts = alerts.filter((alert) => alert.status !== "Resolue");
    return (
    <View style={styles.alertHiveCard}>
      <Pressable style={styles.alertHiveHeader} onPress={onPress}>
        <View style={styles.alertHiveIcon}>
          <Ionicons name="cube-outline" size={16} color={colors.brandPurple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.alertHiveTitle}>{hive.name}</Text>
          <View style={styles.alertHiveMetaRow}>
            <Ionicons name="location" size={10} color={colors.ink400} />
            <Text style={styles.alertHiveMeta} numberOfLines={1}>{hive.farmName}</Text>
          </View>
        </View>
        <View style={styles.alertCountPill}>
          <Ionicons name="warning-outline" size={10} color={colors.brandOrangeHover} />
          <Text style={styles.alertCountText}>{activeAlerts.length || alerts.length} Alertes</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.brandPurple}
        />
      </Pressable>
    </View>
    );
}

const styles = StyleSheet.create({
  alertHiveCard: { borderRadius: 14, backgroundColor: colors.white, padding: 12, gap: 10, ...softShadow },
  alertHiveCardOpen: { borderWidth: 1.5, borderColor: colors.primary100 },
  alertHiveHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  alertHiveIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.primary100, alignItems: "center", justifyContent: "center" },
  alertHiveTitle: { color: colors.ink800, fontSize: 13, fontWeight: "900" },
  alertHiveMetaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  alertHiveMeta: { flex: 1, color: colors.ink400, fontSize: 10, fontWeight: "700" },
  alertCountPill: { borderRadius: 12, backgroundColor: colors.accent100, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 4 },
  alertCountText: { color: colors.brandOrangeHover, fontSize: 8, fontWeight: "900" },
  alertHiveExpanded: { gap: 8, paddingTop: 2 },
  alertInlineWarning: { minHeight: 30, borderRadius: 8, backgroundColor: "#FFD99F", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10 },
  alertInlineDanger: { backgroundColor: "#FFB7A4" },
  alertInlineText: { flex: 1, color: colors.brandOrangeHover, fontSize: 10, fontWeight: "900" },
  alertInlineDangerText: { color: colors.danger },
  alertConsultButton: { height: 44, borderRadius: 22, backgroundColor: colors.brandPurple, alignItems: "center", justifyContent: "center" },
  alertConsultText: { color: colors.white, fontSize: 12, fontWeight: "900" },
});
