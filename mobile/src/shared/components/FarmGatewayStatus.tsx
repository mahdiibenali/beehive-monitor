import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";

export function FarmGatewayStatus({ gatewaySerial }: { gatewaySerial?: string }) {
    return (
    <View style={styles.farmGatewayCard}>
      <View style={styles.farmGatewayIcon}><Ionicons name="swap-vertical" size={18} color={colors.white} /></View>
      <View style={{ flex: 1 }}><Text style={styles.farmGatewayLabel}>Gateway</Text><Text style={styles.farmGatewayName}>{gatewaySerial ?? "--"}</Text></View>
      <View style={styles.farmGatewayBadge}><Text style={styles.farmGatewayBadgeText}>En ligne</Text></View>
    </View>
    );
}

const styles = StyleSheet.create({
  farmGatewayCard: { minHeight: 66, borderRadius: 16, backgroundColor: colors.white, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, ...softShadow },
  farmGatewayIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.brandPurple, alignItems: "center", justifyContent: "center" },
  farmGatewayLabel: { color: colors.ink400, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  farmGatewayName: { color: colors.ink800, fontSize: 14, fontWeight: "900", marginTop: 2 },
  farmGatewayBadge: { borderRadius: 10, backgroundColor: "#E8F6EF", paddingHorizontal: 8, paddingVertical: 5 },
  farmGatewayBadgeText: { color: colors.success, fontSize: 9, fontWeight: "900" },
});

