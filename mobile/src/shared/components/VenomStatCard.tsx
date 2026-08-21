import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";

export function VenomStatCard({
      label,
      labelColor,
      value,
      unit,
      sub,
      alert
    }: {
          label: string;
          labelColor: string;
          value: string | number;
          unit?: string;
          sub?: string;
          alert?: boolean;
        }) {
    const isAlertActive = alert && value !== "00" && value !== 0 && value !== "0" && value !== "00/00";
    return (
    <View style={[styles.venomStatCard, isAlertActive && { borderColor: colors.brandOrange, borderWidth: 1.5 }]}>
      <Text style={[styles.venomStatLabel, { color: labelColor }]}>{label}</Text>
      <View style={styles.venomStatValueRow}>
        <Text style={[styles.venomStatValue, isAlertActive && { color: colors.brandOrange }]}>{value}</Text>
        {unit ? <Text style={styles.venomStatUnit}>{unit}</Text> : null}
      </View>
      {sub ? <Text style={styles.venomStatSub}>{sub}</Text> : null}
    </View>
    );
}

const styles = StyleSheet.create({
  venomStatCard: {
        flex: 1,
        minHeight: 82,
        borderRadius: 12,
        backgroundColor: colors.white,
        paddingHorizontal: 14,
        paddingVertical: 12,
        justifyContent: "center",
        ...softShadow
      },
  venomStatLabel: {
        fontSize: 11,
        lineHeight: 14,
        fontWeight: "700",
        marginBottom: 2
      },
  venomStatValueRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4
      },
  venomStatValue: {
        color: colors.ink800,
        fontSize: 25,
        lineHeight: 30,
        fontWeight: "900"
      },
  venomStatUnit: {
        color: colors.ink700,
        fontSize: 16,
        lineHeight: 19,
        fontWeight: "800"
      },
  venomStatSub: {
        color: colors.brandPurple,
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "800",
        marginTop: 1
      },
});

