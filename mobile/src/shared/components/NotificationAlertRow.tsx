import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";
import { HiveAlertItem } from "../../shared/types/types";

export function NotificationAlertRow({ alert, onPress, onLongPress, selectable = false, selected = false }: { alert: HiveAlertItem; onPress?: () => void; onLongPress?: () => void; selectable?: boolean; selected?: boolean; }) {
    const danger = alert.tone === "red";
    const statusColor = alert.status === "Resolue" ? colors.brandPurple : alert.status === "Non resolue" ? colors.danger : colors.brandOrangeHover;
    const bgColor = alert.status === "Resolue" ? "#E6EAFF" : alert.status === "Non resolue" ? "#FFE6E6" : "#FFF0E6";
    const borderColor = alert.status === "Non resolue" || alert.status === "En cours" ? colors.brandOrangeHover : "#F0F0F0";
    return (
    <Pressable 
      style={[
        { 
          borderRadius: 12, 
          backgroundColor: colors.white, 
          paddingVertical: 12,
          paddingHorizontal: 12, 
          marginBottom: 10, 
          borderWidth: 1, 
          borderColor: borderColor 
        },
        selected && { borderWidth: 1.5, borderColor: colors.brandPurple }
      ]} 
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {selectable && (
        <View style={{ marginBottom: 12 }}>
          <Ionicons 
            name={selected ? "checkbox" : "square-outline"} 
            size={24} 
            color={selected ? colors.brandPurple : colors.ink200} 
          />
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={[styles.alertRowIcon, danger && styles.alertRowIconDanger, { width: 36, height: 36, borderRadius: 10 }]}>
          <Ionicons
            name={danger ? "git-compare-outline" : "battery-half-outline"}
            size={18}
            color={danger ? colors.danger : colors.brandOrangeHover}
          />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[styles.alertRowTitle, danger && styles.alertRowTitleDanger, { fontSize: 14, flex: 1, marginRight: 8 }]} numberOfLines={1}>
              {alert.title}
            </Text>
            <View style={[styles.alertStatusPill, { backgroundColor: bgColor, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
              <Text style={{ color: statusColor, fontSize: 10, fontWeight: "600" }}>
                {alert.status === "Resolue" ? "Résolue" : alert.status === "Non resolue" ? "Non résolue" : "En cours"}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="location" size={12} color={colors.ink400} />
            <Text style={{ color: colors.ink500, fontSize: 12, fontWeight: "500" }} numberOfLines={1}>{alert.farmName}</Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="calendar-outline" size={12} color={colors.ink400} />
              <Text style={{ color: colors.ink400, fontSize: 12, fontWeight: "500" }}>{alert.date}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="time-outline" size={12} color={colors.ink400} />
              <Text style={{ color: colors.ink400, fontSize: 12, fontWeight: "500" }}>{alert.time}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
    );
}

const styles = StyleSheet.create({
  alertRowIcon: { width: 31, height: 31, borderRadius: 9, backgroundColor: colors.accent100, alignItems: "center", justifyContent: "center" },
  alertRowIconDanger: { backgroundColor: "#FFEEEC" },
  alertRowTitle: { flex: 1, color: colors.brandOrangeHover, fontSize: 11, fontWeight: "900" },
  alertRowTitleDanger: { color: colors.danger },
  alertStatusPill: { borderRadius: 10, backgroundColor: colors.primary100, paddingHorizontal: 7, paddingVertical: 3 },
});

