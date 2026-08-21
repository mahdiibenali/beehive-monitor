import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { LatestAlertRow } from "./LatestAlertRow";
import { HomeAlertItem } from "../../shared/types/types";

export function LatestAlertsPanel({
      alerts,
      onViewAll
    }: {
          alerts: HomeAlertItem[];
          onViewAll: () => void;
        }) {
    return (
    <View style={styles.latestAlertsPanel}>
      <View style={styles.latestAlertsHeader}>
        <Ionicons name="information-circle-outline" size={16} color={colors.ink400} />
        <Text style={styles.latestAlertsTitle}>Derni?re alertes</Text>
      </View>
      <View style={styles.latestAlertList}>
        {alerts.length > 0 ? (
          alerts.map((alert) => <LatestAlertRow key={alert.id} alert={alert} />)
        ) : (
          <Text style={styles.latestAlertEmpty}>Aucune alerte</Text>
        )}
      </View>
      <Pressable
        style={[styles.viewAllAlertsButton, alerts.length === 0 && styles.viewAllAlertsButtonEmpty]}
        onPress={onViewAll}
      >
        <Text style={[styles.viewAllAlertsText, alerts.length === 0 && styles.viewAllAlertsTextEmpty]}>
          Voir toutes les alertes
        </Text>
      </Pressable>
    </View>
    );
}

const styles = StyleSheet.create({
  latestAlertsPanel: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 12,
        gap: 10,
        ...softShadow
      },
  latestAlertsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7
      },
  latestAlertsTitle: {
        color: colors.ink400,
        fontSize: 12,
        fontWeight: "800"
      },
  latestAlertList: {
        gap: 8,
        minHeight: 58,
        justifyContent: "center"
      },
  latestAlertEmpty: {
        color: colors.ink400,
        textAlign: "center",
        fontSize: 11,
        fontWeight: "600"
      },
  viewAllAlertsButton: {
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.brandPurple,
        alignItems: "center",
        justifyContent: "center"
      },
  viewAllAlertsButtonEmpty: {
        backgroundColor: colors.ink200
      },
  viewAllAlertsText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: "900"
      },
  viewAllAlertsTextEmpty: {
        color: colors.white
      },
});

