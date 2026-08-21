import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";
import { AlertFilterRow } from "./AlertFilterRow";
import { AlertRow } from "./AlertRow";
import { HomeTopBar } from "./HomeTopBar";
import { EmptyState, Screen } from "./ui";
import { AlertStatusFilter, HiveAlertItem } from "../../shared/types/types";

export function AllAlertsView({
      alerts,
      filter,
      onFilter,
      onBack,
      onOpen,
      onNotifications,
      onProfile
    }: {
          alerts: HiveAlertItem[];
          filter: AlertStatusFilter;
          onFilter: (filter: AlertStatusFilter) => void;
          onBack: () => void;
          onOpen: (alert: HiveAlertItem) => void;
          onNotifications: () => void;
          onProfile: () => void;
        }) {
    return (
    <Screen style={styles.alertScreen}>
      <HomeTopBar
        onBack={onBack}
        onNotifications={onNotifications}
        onProfile={onProfile}
        hasNotifications={alerts.some((alert) => alert.status !== "Resolue")}
      />
      <View style={styles.alertSheetHandle} />
      <View style={styles.alertBreadcrumb}>
        <View style={styles.alertBreadcrumbIcon}>
          <Ionicons name="cube-outline" size={14} color={colors.brandPurple} />
        </View>
        <Text style={styles.alertBreadcrumbText}>Alertes</Text>
        <View style={{ flex: 1 }} />
        <Ionicons name="location" size={17} color={colors.brandPurple} />
      </View>
      <AlertFilterRow filter={filter} onFilter={onFilter} />
      <View style={styles.alertListPanel}>
        {alerts.length === 0 ? <EmptyState text="Aucune alerte." /> : null}
        {alerts.map((alert) => (
          <AlertRow key={alert.id} alert={alert} onPress={() => onOpen(alert)} />
        ))}
      </View>
    </Screen>
    );
}

const styles = StyleSheet.create({
  alertScreen: { paddingTop: 32, gap: 12 },
  alertSheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.ink200, alignSelf: "center", marginTop: -4 },
  alertBreadcrumb: { minHeight: 42, borderRadius: 12, backgroundColor: colors.primary100, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10 },
  alertBreadcrumbIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  alertBreadcrumbText: { flex: 1, color: colors.brandPurple, fontSize: 11, fontWeight: "900" },
  alertListPanel: { gap: 8 },
});

