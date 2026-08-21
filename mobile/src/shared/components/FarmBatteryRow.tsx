import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";
import { formatMaybeNumber } from "../utils/helpers";

export function FarmBatteryRow({ label, value, charging = false }: { label: string; value: number | null; charging?: boolean }) {
    const width = typeof value === "number" ? Math.max(8, value) : 0;
    return <View style={styles.farmBatteryRow}><Text style={styles.farmBatteryLabel}>{label}</Text><View style={styles.farmBatteryBar}><View style={[styles.farmBatteryFill, { width: `${width}%` as `${number}%` }]} /></View><Text style={styles.farmBatteryValue}>{formatMaybeNumber(value, "%")}</Text>{charging && typeof value === "number" ? <Ionicons name="flash" size={13} color={colors.brandPurple} /> : null}</View>;
}

const styles = StyleSheet.create({
  farmBatteryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  farmBatteryLabel: { width: 76, color: colors.ink700, fontSize: 11, fontWeight: "800" },
  farmBatteryBar: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.primary100, overflow: "hidden" },
  farmBatteryFill: { height: "100%", borderRadius: 4, backgroundColor: colors.brandPurple },
  farmBatteryValue: { width: 34, color: colors.ink500, fontSize: 10, fontWeight: "900" },
});

