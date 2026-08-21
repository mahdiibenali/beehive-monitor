import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadow } from "../theme/theme";

export function AttentionBanner({ count, onPress }: { count: number; onPress: () => void }) {
    if (count <= 0) return null;
    return (
    <Pressable style={styles.attentionBanner} onPress={onPress}>
      <View style={styles.attentionIconBox}>
        <Ionicons name="warning-outline" size={22} color={colors.brandOrangeHover} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.attentionCount}>{String(count).padStart(2, "0")} Ruches</Text>
        <Text style={styles.attentionText}>n?cessitent de l'attention</Text>
      </View>
      <View style={styles.attentionArrow}>
        <Ionicons name="chevron-forward" size={14} color={colors.brandOrangeHover} />
      </View>
    </Pressable>
    );
}

const styles = StyleSheet.create({
  attentionBanner: {
        minHeight: 66,
        borderRadius: 14,
        backgroundColor: colors.brandOrange,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        ...shadow
      },
  attentionIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center"
      },
  attentionCount: {
        color: colors.white,
        fontSize: 15,
        lineHeight: 18,
        fontWeight: "900"
      },
  attentionText: {
        color: "rgba(255,255,255,0.76)",
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "700"
      },
  attentionArrow: {
        width: 24,
        height: 24,
        borderRadius: 7,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center"
      },
});

