import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { HiveAlertItem } from "../../shared/types/types";

export function AlertRow({ alert, onPress, onLongPress, selectable = false, selected = false }: { alert: HiveAlertItem; onPress?: () => void; onLongPress?: () => void; selectable?: boolean; selected?: boolean; }) {
    const danger = alert.tone === "red";
    return (
    <Pressable 
      style={[styles.alertRowCard, selected && { borderWidth: 1.5, borderColor: colors.brandPurple }]} 
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {selectable && (
        <View style={{ marginRight: 8, justifyContent: "flex-start", paddingTop: 4 }}>
          <Ionicons 
            name={selected ? "checkbox" : "square-outline"} 
            size={20} 
            color={selected ? colors.brandPurple : colors.ink200} 
          />
        </View>
      )}
      <View style={[styles.alertRowIcon, danger && styles.alertRowIconDanger]}>
        <Ionicons
          name={danger ? "git-compare-outline" : "battery-half-outline"}
          size={15}
          color={danger ? colors.danger : colors.brandOrangeHover}
        />
      </View>
      <View style={styles.alertRowBody}>
        <View style={styles.alertRowTop}>
          <Text style={[styles.alertRowTitle, danger && styles.alertRowTitleDanger]} numberOfLines={1}>
            {alert.title}
          </Text>
          <View style={[styles.alertStatusPill, alert.status === "Resolue" && { backgroundColor: "#E6EAFF" }, alert.status === "Non resolue" && { backgroundColor: "#FFE6E6" }]}>
            <Text style={[styles.alertStatusText, alert.status === "Resolue" && { color: colors.brandPurple }, alert.status === "Non resolue" && { color: colors.danger }, alert.status === "En cours" && { color: colors.brandOrangeHover }]}>
              {alert.status === "Resolue" ? "• Résolue" : alert.status === "Non resolue" ? "• Non résolue" : "• En cours"}
            </Text>
          </View>
        </View>
        <Text style={styles.alertRowFarm} numberOfLines={1}>{alert.farmName}</Text>
        <View style={styles.alertRowMeta}>
          <Ionicons name="calendar-outline" size={10} color={colors.ink400} />
          <Text style={styles.alertRowMetaText}>{alert.date}</Text>
          <Ionicons name="time-outline" size={10} color={colors.ink400} />
          <Text style={styles.alertRowMetaText}>{alert.time}</Text>
        </View>
      </View>
    </Pressable>
    );
}

const styles = StyleSheet.create({
  alertRowCard: { minHeight: 64, borderRadius: 12, backgroundColor: colors.white, flexDirection: "row", gap: 9, padding: 9, ...softShadow },
  alertRowIcon: { width: 31, height: 31, borderRadius: 9, backgroundColor: colors.accent100, alignItems: "center", justifyContent: "center" },
  alertRowIconDanger: { backgroundColor: "#FFEEEC" },
  alertRowBody: { flex: 1, gap: 2 },
  alertRowTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  alertRowTitle: { flex: 1, color: colors.brandOrangeHover, fontSize: 11, fontWeight: "900" },
  alertRowTitleDanger: { color: colors.danger },
  alertStatusPill: { borderRadius: 10, backgroundColor: colors.primary100, paddingHorizontal: 7, paddingVertical: 3 },
  alertStatusText: { color: colors.brandPurple, fontSize: 8, fontWeight: "900" },
  alertRowFarm: { color: colors.ink700, fontSize: 10, fontWeight: "700" },
  alertRowMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  alertRowMetaText: { color: colors.ink400, fontSize: 9, fontWeight: "700" },
});

