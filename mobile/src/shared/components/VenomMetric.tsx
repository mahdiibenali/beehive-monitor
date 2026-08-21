import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../shared/theme/theme";

export function VenomMetric({ value, label }: { value: string; label: string }) {
    return (
    <View style={styles.venomMetricBox}>
      <Text style={styles.venomMetricValue}>{value}</Text>
      <Text style={styles.venomMetricLabel}>{label}</Text>
    </View>
    );
}

const styles = StyleSheet.create({
  venomMetricBox: {
        flex: 1,
        minHeight: 48,
        borderRadius: 10,
        backgroundColor: "#F5F6FE",
        justifyContent: "center",
        paddingHorizontal: 8
      },
  venomMetricValue: {
        color: colors.brandPurple,
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "800"
      },
  venomMetricLabel: {
        color: colors.ink400,
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "700"
      },
});

