import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { VenomMetric } from "./VenomMetric";
import { VenomHiveItem } from "../../shared/types/types";

export function VenomHiveCard({ item, onPress }: { item: VenomHiveItem; onPress?: () => void }) {
    const statusLabel = item.isAlert ? "Alertes" : item.isActive ? "Actif" : "Inactif";
    const statusColor = item.isAlert
            ? colors.brandOrangeHover
            : item.isActive
              ? colors.brandPurple
              : colors.ink400;
    return (
    <Pressable onPress={onPress}>
      <View style={[styles.venomHiveCard, item.isAlert && styles.venomHiveCardAlert]}>
      <View style={styles.venomHiveHeader}>
        <View style={styles.venomHiveMain}>
          <View style={styles.venomHiveIcon}>
            <Ionicons name="layers-outline" size={19} color={colors.brandPurple} />
          </View>
          <View style={styles.venomHiveTitleBlock}>
            <Text style={styles.venomHiveTitle}>{item.name}</Text>
            <View style={styles.venomHiveLocation}>
              <Ionicons name="location-outline" size={12} color={colors.ink400} />
              <Text style={styles.venomHiveFarm} numberOfLines={1}>
                {item.farm}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.venomStatusBadge,
            item.isAlert
              ? styles.venomStatusAlert
              : item.isActive
                ? styles.venomStatusActive
                : styles.venomStatusInactive
          ]}
        >
          <View style={[styles.venomStatusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.venomStatusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>
      <View style={styles.venomMetricsRow}>
        <VenomMetric value={item.collected} label="Collecté" />
        <VenomMetric value={item.plaque} label="Plaque" />
        <VenomMetric value={item.lastDate} label="Collecté" />
      </View>
      </View>
    </Pressable>
    );
}

const styles = StyleSheet.create({
  venomHiveCard: {
        borderRadius: 16,
        backgroundColor: colors.white,
        padding: 12,
        borderWidth: 1.5,
        borderColor: "transparent",
        ...softShadow
      },
  venomHiveCardAlert: {
        borderColor: colors.brandOrangeHover
      },
  venomHiveHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 10
      },
  venomHiveMain: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10
      },
  venomHiveIcon: {
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: colors.primary100,
        alignItems: "center",
        justifyContent: "center"
      },
  venomHiveTitleBlock: {
        flex: 1
      },
  venomHiveTitle: {
        color: colors.ink700,
        fontSize: 15,
        lineHeight: 18,
        fontWeight: "700"
      },
  venomHiveLocation: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        marginTop: 2
      },
  venomHiveFarm: {
        flex: 1,
        color: colors.ink400,
        fontSize: 10,
        lineHeight: 12,
        fontWeight: "700"
      },
  venomStatusBadge: {
        minHeight: 24,
        borderRadius: 12,
        paddingHorizontal: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 5
      },
  venomStatusAlert: {
        backgroundColor: colors.accent100
      },
  venomStatusActive: {
        backgroundColor: colors.primary100
      },
  venomStatusInactive: {
        backgroundColor: colors.ink100
      },
  venomStatusDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5
      },
  venomStatusText: {
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "800"
      },
  venomMetricsRow: {
        flexDirection: "row",
        gap: 8
      },
});

