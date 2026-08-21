import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";
import { HomeAlertItem } from "../../shared/types/types";

export function LatestAlertRow({ alert }: { alert: HomeAlertItem }) {
    const toneStyle = alert.tone === "red"
            ? styles.latestAlertRed
            : alert.tone === "purple"
              ? styles.latestAlertPurple
              : styles.latestAlertOrange;
    return (
    <View style={[styles.latestAlertCard, toneStyle]}>
      <View style={styles.latestAlertIcon}>
        <Ionicons
          name={alert.tone === "red" ? "git-compare-outline" : "battery-half-outline"}
          size={16}
          color={alert.tone === "red" ? colors.danger : colors.brandOrangeHover}
        />
      </View>
      <View style={styles.latestAlertBody}>
        <View style={styles.latestAlertTopLine}>
          <Text style={styles.latestAlertName} numberOfLines={1}>{alert.title}</Text>
          <View style={styles.latestAlertStatusPill}>
            <Text style={styles.latestAlertStatusText}>{alert.status}</Text>
          </View>
        </View>
        <Text style={styles.latestAlertLocation} numberOfLines={1}>{alert.location}</Text>
        <View style={styles.latestAlertMeta}>
          <Ionicons name="calendar-outline" size={10} color={colors.ink400} />
          <Text style={styles.latestAlertMetaText}>{alert.date}</Text>
          <Ionicons name="time-outline" size={10} color={colors.ink400} />
          <Text style={styles.latestAlertMetaText}>{alert.time}</Text>
        </View>
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  latestAlertRed: {
        borderColor: colors.danger
      },
  latestAlertPurple: {
        borderColor: colors.brandPurple
      },
  latestAlertOrange: {
        borderColor: colors.brandOrange
      },
  latestAlertCard: {
        minHeight: 58,
        borderRadius: 12,
        padding: 8,
        flexDirection: "row",
        gap: 8,
        backgroundColor: colors.white,
        borderWidth: 1.5
      },
  latestAlertIcon: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: colors.accent100,
        alignItems: "center",
        justifyContent: "center"
      },
  latestAlertBody: {
        flex: 1,
        gap: 2
      },
  latestAlertTopLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
      },
  latestAlertName: {
        flex: 1,
        color: colors.ink800,
        fontSize: 11,
        fontWeight: "900"
      },
  latestAlertStatusPill: {
        borderRadius: 10,
        backgroundColor: colors.primary100,
        paddingHorizontal: 7,
        paddingVertical: 3
      },
  latestAlertStatusText: {
        color: colors.brandPurple,
        fontSize: 8,
        fontWeight: "900"
      },
  latestAlertLocation: {
        color: colors.ink700,
        fontSize: 10,
        fontWeight: "700"
      },
  latestAlertMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
      },
  latestAlertMetaText: {
        color: colors.ink400,
        fontSize: 9,
        fontWeight: "700"
      },
});

