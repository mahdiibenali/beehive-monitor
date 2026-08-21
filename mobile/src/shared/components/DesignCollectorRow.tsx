import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";

export function DesignCollectorRow({
      icon,
      label,
      value,
      badge,
      badgeTone = "gray",
      danger = false,
      expanded = false,
      customValue,
      onPress,
      children
    }: {
          icon: keyof typeof Ionicons.glyphMap;
          label: string;
          value?: string;
          badge?: string;
          badgeTone?: "purple" | "red" | "orange" | "gray" | "green";
          danger?: boolean;
          expanded?: boolean;
          customValue?: React.ReactNode;
          onPress?: () => void;
          children?: React.ReactNode;
        }) {
    const red = badgeTone === "red";
    const orange = badgeTone === "orange";
    const gray = badgeTone === "gray";
    const green = badgeTone === "green";
    return (
    <Pressable onPress={onPress}>
      <View style={[expanded ? styles.designExpandedMetricCard : styles.designCollectorRow, danger && !expanded && styles.designCollectorRowDanger]}>
        <View style={expanded ? styles.designMetricHeader : { flexDirection: "row", flex: 1 }}>
          <View style={[styles.designMetricTitleRow, { flex: 1 }]}>
            <View style={styles.designMetricIconBox}>
              <Ionicons name={icon} size={18} color={colors.ink700} />
            </View>
            <Text style={styles.designMetricTitle}>{label}</Text>
          </View>
          <View style={styles.designMetricValueRow}>
            {expanded && value ? (
              <Text style={styles.designMetricValue}>{value}</Text>
            ) : customValue && !expanded ? (
              customValue
            ) : badge && !expanded ? (
              <View style={[styles.designStatusPill, red && styles.designStatusPillRed, orange && styles.designStatusPillOrange, gray && styles.designStatusPillGrayAlt, green && styles.designStatusPillGreen]}>
                {!red ? <View style={[styles.designStatusDotPurple, orange && styles.designStatusDotOrange, gray && styles.designStatusDotMuted, green && styles.designStatusDotGreen]} /> : null}
                <Text style={[styles.designStatusText, red && styles.designStatusTextRed, orange && styles.designStatusTextOrange, gray && styles.designStatusTextGrayAlt, green && styles.designStatusTextGreen]}>{badge}</Text>
              </View>
            ) : null}
            {children ? (
              <View style={styles.designMetricChevron}>
                <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={colors.ink500} />
              </View>
            ) : null}
          </View>
        </View>
        {expanded && children}
      </View>
    </Pressable>
    );
}

const styles = StyleSheet.create({
  designExpandedMetricCard: { borderRadius: 16, backgroundColor: colors.white, overflow: "hidden", ...softShadow },
  designCollectorRow: { minHeight: 67, borderRadius: 16, backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, ...softShadow },
  designCollectorRowDanger: { borderWidth: 1.5, borderColor: colors.danger },
  designMetricHeader: { minHeight: 67, paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  designMetricTitleRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  designMetricIconBox: { width: 35, height: 35, borderRadius: 7, backgroundColor: colors.ink200, alignItems: "center", justifyContent: "center" },
  designMetricTitle: { color: colors.ink700, fontSize: 18, lineHeight: 20, fontWeight: "500" },
  designMetricValueRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  designMetricValue: { color: colors.ink700, fontSize: 14, fontWeight: "500" },
  designStatusPill: { borderRadius: 999, backgroundColor: "#ABB3EF", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4 },
  designStatusPillRed: { backgroundColor: colors.danger },
  designStatusPillOrange: { backgroundColor: colors.accent100 },
  designStatusPillGrayAlt: { backgroundColor: "#ECEEF9" },
  designStatusPillGreen: { backgroundColor: "#E8F6EF" },
  designStatusDotPurple: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brandPurple },
  designStatusDotOrange: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brandOrange },
  designStatusDotMuted: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ink400 },
  designStatusDotGreen: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#34C759" },
  designStatusText: { color: colors.brandPurple, fontSize: 12, fontWeight: "500" },
  designStatusTextRed: { color: colors.accent50 },
  designStatusTextOrange: { color: colors.brandOrangeHover },
  designStatusTextGrayAlt: { color: colors.ink500 },
  designStatusTextGreen: { color: "#248A3D" },
  designMetricChevron: { borderRadius: 4, backgroundColor: colors.ink100, padding: 2 },
});

