import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../../shared/theme/theme";

export function FarmCollectorBanner({ active }: { active: number | null }) {
    return (
    <View style={styles.farmCollectorBanner}>
      <View style={styles.farmCollectorDot} />
      <Text style={styles.farmCollectorText}>Collecteurs en marche</Text>
      <View style={styles.farmActiveBadge}><View style={styles.farmActiveDot} /><Text style={styles.farmActiveText}>{active ?? "--"} actif</Text></View>
    </View>
    );
}

const styles = StyleSheet.create({
  farmCollectorBanner: { minHeight: 50, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink200, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, ...softShadow },
  farmCollectorDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brandPurple },
  farmCollectorText: { flex: 1, color: colors.brandPurple, fontSize: 12, fontWeight: "900" },
  farmActiveBadge: { borderRadius: 12, backgroundColor: colors.primary100, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5 },
  farmActiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.brandPurple },
  farmActiveText: { color: colors.brandPurple, fontSize: 9, fontWeight: "900" },
});

