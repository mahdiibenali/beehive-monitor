import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../shared/theme/theme";

export function FarmTinyTrend({ color }: { color: string }) {
    return <View style={styles.farmTinyTrend}>{[24, 42, 34, 56, 48].map((height, index) => <View key={index} style={[styles.farmTrendBar, { height, backgroundColor: color, opacity: 0.35 + index * 0.1 }]} />)}</View>;
}

const styles = StyleSheet.create({
  farmTinyTrend: { height: 70, borderRadius: 14, backgroundColor: colors.ink100, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingHorizontal: 24, paddingBottom: 10 },
  farmTrendBar: { width: 10, borderRadius: 5 },
});

