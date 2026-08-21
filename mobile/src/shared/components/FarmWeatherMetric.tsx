import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";

export function FarmWeatherMetric({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
    return <View style={styles.farmWeatherMetric}><Ionicons name={icon} size={12} color={colors.ink400} /><Text style={styles.farmWeatherMetricText}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  farmWeatherMetric: { flexDirection: "row", alignItems: "center", gap: 4 },
  farmWeatherMetricText: { color: colors.ink500, fontSize: 10, fontWeight: "700" },
});

