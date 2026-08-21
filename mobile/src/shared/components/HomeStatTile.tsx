import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";

export function HomeStatTile({
      label,
      value,
      unit,
      subtitle,
      icon,
      wide = false
    }: {
          label: string;
          value: string | number;
          unit?: string;
          subtitle?: string;
          icon: keyof typeof Ionicons.glyphMap;
          wide?: boolean;
        }) {
    return (
    <View style={[styles.homeStatTile, wide && styles.homeStatTileWide]}>
      <View style={styles.homeStatHeader}>
        <Text style={styles.homeStatLabel}>{label}</Text>
        <View style={styles.homeStatIconBox}>
          <Ionicons name={icon} size={15} color={colors.brandPurple} />
        </View>
      </View>
      <View style={styles.homeStatValueRow}>
        <Text style={styles.homeStatValue}>{value}</Text>
        {unit ? <Text style={styles.homeStatUnit}>{unit}</Text> : null}
      </View>
      {subtitle ? <Text style={styles.homeStatSubtitle}>{subtitle}</Text> : null}
    </View>
    );
}

const styles = StyleSheet.create({
  homeStatTile: {
        width: "48.5%",
        minHeight: 78,
        borderRadius: 12,
        backgroundColor: colors.white,
        padding: 12,
        ...softShadow
      },
  homeStatTileWide: {
        width: "100%"
      },
  homeStatHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4
      },
  homeStatLabel: {
        color: colors.ink400,
        fontSize: 10,
        fontWeight: "800"
      },
  homeStatIconBox: {
        width: 22,
        height: 22,
        borderRadius: 7,
        backgroundColor: colors.primary100,
        alignItems: "center",
        justifyContent: "center"
      },
  homeStatValueRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 3
      },
  homeStatValue: {
        color: colors.ink800,
        fontSize: 23,
        lineHeight: 27,
        fontWeight: "900"
      },
  homeStatUnit: {
        color: colors.ink700,
        fontSize: 14,
        fontWeight: "800"
      },
  homeStatSubtitle: {
        color: colors.brandPurple,
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "800"
      },
});

