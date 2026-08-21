import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { formatMaybeNumber } from "../utils/helpers";
import { FarmHiveItem } from "../../shared/types/types";

export function FarmHiveCard({ hive, onPress }: { hive: FarmHiveItem; onPress?: () => void }) {
    return (
    <Pressable onPress={onPress}>
      <View style={[styles.farmHiveCard, hive.isCritical && styles.farmHiveCardCritical]}>
      <View style={styles.farmHiveMainRow}>
        <View style={styles.farmHiveIcon}><Ionicons name="cube-outline" size={16} color={colors.brandPurple} /></View>
        <View style={{ flex: 1 }}><Text style={styles.farmHiveTitle}>{hive.name}</Text><Text style={styles.farmHiveMeta}>{hive.farmName}</Text></View>
        <View style={[styles.farmHiveBadge, hive.isCritical && styles.farmHiveBadgeCritical]}>
          <Text style={[styles.farmHiveBadgeText, hive.isCritical && styles.farmHiveBadgeTextCritical]}>{hive.isCritical ? "Critique" : "Normal"}</Text>
        </View>
      </View>
      <View style={styles.farmHiveFooter}>
        <Text style={styles.farmHiveSmall}>B-S {formatMaybeNumber(hive.batteryS, "%")}</Text>
        <Text style={styles.farmHiveSmall}>B-C {formatMaybeNumber(hive.batteryC, "%")}</Text>
        <Text style={styles.farmHiveSmall}>Vu {hive.lastSeen ?? "--"}</Text>
      </View>
      </View>
    </Pressable>
    );
}

const styles = StyleSheet.create({
  farmHiveCard: { borderRadius: 14, backgroundColor: colors.white, padding: 12, borderWidth: 1, borderColor: "transparent", gap: 8, ...softShadow },
  farmHiveCardCritical: { borderColor: colors.brandOrange },
  farmHiveMainRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  farmHiveIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.primary100, alignItems: "center", justifyContent: "center" },
  farmHiveTitle: { color: colors.ink800, fontSize: 13, fontWeight: "900" },
  farmHiveMeta: { color: colors.ink400, fontSize: 10, fontWeight: "700" },
  farmHiveBadge: { borderRadius: 10, backgroundColor: colors.primary100, paddingHorizontal: 8, paddingVertical: 4 },
  farmHiveBadgeCritical: { backgroundColor: colors.accent100 },
  farmHiveBadgeText: { color: colors.brandPurple, fontSize: 8, fontWeight: "900" },
  farmHiveBadgeTextCritical: { color: colors.brandOrangeHover },
  farmHiveFooter: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  farmHiveSmall: { color: colors.ink500, fontSize: 9, fontWeight: "800", backgroundColor: colors.ink100, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
});

