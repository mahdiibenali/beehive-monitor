import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";

export function ConditionRow({
      icon,
      label,
      badge,
      tone,
      compact = false,
      expanded = false
    }: {
          icon: keyof typeof Ionicons.glyphMap;
          label: string;
          badge: string;
          tone: "red" | "orange" | "plain";
          compact?: boolean;
          expanded?: boolean;
        }) {
    const toneStyle = tone === "red"
            ? styles.conditionBadgeDanger
            : tone === "orange"
              ? styles.conditionBadgeOrange
              : styles.conditionBadgePlain;
    return (
    <View style={[styles.conditionRow, compact && styles.conditionRowCompact]}>
      <View style={styles.conditionRowIcon}>
        <Ionicons name={icon} size={14} color={colors.brandPurple} />
      </View>
      <Text style={styles.conditionRowText}>{label}</Text>
      <View style={[styles.conditionBadge, toneStyle]}>
        <Text style={[styles.conditionBadgeText, tone === "plain" && styles.conditionBadgeTextPlain]}>{badge}</Text>
      </View>
      <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={colors.brandPurple} />
    </View>
    );
}

const styles = StyleSheet.create({
  conditionBadgeDanger: { backgroundColor: colors.danger },
  conditionBadgeOrange: { backgroundColor: colors.brandOrange },
  conditionBadgePlain: { backgroundColor: colors.white },
  conditionRow: { minHeight: 46, borderRadius: 12, backgroundColor: colors.primary100, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10 },
  conditionRowCompact: { backgroundColor: colors.white, paddingHorizontal: 0, minHeight: 34 },
  conditionRowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  conditionRowText: { flex: 1, color: colors.ink700, fontSize: 12, fontWeight: "900" },
  conditionBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 },
  conditionBadgeText: { color: colors.white, fontSize: 8, fontWeight: "900" },
  conditionBadgeTextPlain: { color: colors.danger },
});

