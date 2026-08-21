import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { FermeListItem } from "../types/types";

export function FermeAccordionCard({ ferme, onConsult }: { ferme: FermeListItem; onConsult: () => void }) {
    const hasAlerts = ferme.ruchesAttention > 0;
    return (
    <Pressable style={styles.farmAccordionCard} onPress={onConsult}>
      <View style={styles.farmAccordionTop}>
        <View style={styles.farmAccordionIconBox}>
          <Ionicons name="leaf" size={16} color={colors.brandOrangeHover} />
        </View>
        <View style={styles.farmAccordionBody}>
          <Text style={styles.farmAccordionTitle}>{ferme.nom}</Text>
          <View style={styles.farmAccordionSubRow}>
            <Ionicons name="layers-outline" size={12} color={colors.ink400} />
            <Text style={styles.farmAccordionSubText}>{ferme.ruches} Ruches</Text>
          </View>
        </View>
        {hasAlerts && (
          <View style={styles.farmAccordionBadge}>
            <Ionicons name="warning-outline" size={10} color={colors.white} />
            <Text style={styles.farmAccordionBadgeText}>{ferme.ruchesAttention} Ruches</Text>
          </View>
        )}
        <View style={styles.farmAccordionChevron}>
          <Ionicons name="chevron-forward" size={14} color={colors.brandPurple} />
        </View>
      </View>
    </Pressable>
    );
}

const styles = StyleSheet.create({
  farmAccordionCard: {
        borderRadius: 16,
        backgroundColor: colors.white,
        ...softShadow
      },
  farmAccordionTop: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12
      },
  farmAccordionIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary100,
        alignItems: "center",
        justifyContent: "center"
      },
  farmAccordionBody: {
        flex: 1,
        gap: 2
      },
  farmAccordionTitle: {
        color: colors.ink800,
        fontSize: 15,
        fontWeight: "800"
      },
  farmAccordionSubRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
      },
  farmAccordionSubText: {
        color: colors.ink400,
        fontSize: 11,
        fontWeight: "600"
      },
  farmAccordionBadge: {
        backgroundColor: colors.brandOrangeHover,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4
      },
  farmAccordionBadgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: "800"
      },
  farmAccordionChevron: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: colors.primary100,
        alignItems: "center",
        justifyContent: "center"
      },
});

