import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";
import { AlertStatusFilter } from "../../shared/types/types";

export function AlertFilterRow({
      filter,
      onFilter
    }: {
          filter: AlertStatusFilter;
          onFilter: (filter: AlertStatusFilter) => void;
        }) {
    return (
    <View style={styles.alertFilterRow}>
      {(["Tous", "Resolue", "En cours", "Non resolue"] as AlertStatusFilter[]).map((item) => {
        const active = filter === item;
        return (
          <Pressable
            key={item}
            style={[styles.alertFilterChip, active && styles.alertFilterChipActive]}
            onPress={() => onFilter(item)}
          >
            <Text style={[styles.alertFilterText, active && styles.alertFilterTextActive]} numberOfLines={1}>
              {item}
            </Text>
          </Pressable>
        );
      })}
      <View style={styles.alertCalendarButton}>
        <Ionicons name="calendar-outline" size={15} color={colors.brandPurple} />
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  alertFilterRow: { flexDirection: "row", gap: 5, alignItems: "center", borderRadius: 20, backgroundColor: colors.primary100, padding: 4 },
  alertFilterChip: { flex: 1, minWidth: 0, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  alertFilterChipActive: { backgroundColor: colors.brandPurple },
  alertFilterText: { color: colors.brandPurple, fontSize: 9, fontWeight: "900" },
  alertFilterTextActive: { color: colors.white },
  alertCalendarButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
});

