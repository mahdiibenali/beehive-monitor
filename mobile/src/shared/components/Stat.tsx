import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { Card, Muted } from "./ui";

export function Stat({
      label,
      value,
      icon
    }: {
          label: string;
          value: string | number;
          icon: keyof typeof Ionicons.glyphMap;
        }) {
    return (
    <Card style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.brandPurple} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Muted>{label}</Muted>
    </Card>
    );
}

const styles = StyleSheet.create({
  statCard: {
        width: "47.5%",
        minHeight: 132,
        gap: 10,
        padding: 20
      },
  statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary100,
        alignItems: "center",
        justifyContent: "center",
        ...softShadow
      },
  statValue: {
        color: colors.ink900,
        fontSize: 28,
        fontWeight: "800"
      },
});

