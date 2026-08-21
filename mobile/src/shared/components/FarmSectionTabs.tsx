import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../shared/theme/theme";
import { FarmDetailTab } from "../../shared/types/types";

export function FarmSectionTabs({ active, onChange }: { active: FarmDetailTab; onChange: (tab: FarmDetailTab) => void }) {
    const tabs: FarmDetailTab[] = ["Ruches", "Batterie", "Venin", "Plan"];
    return (
    <View style={styles.farmTabBar}>
      {tabs.map((tab) => {
        const isActive = active === tab;
        return <Pressable key={tab} style={[styles.farmTab, isActive && styles.farmTabActive]} onPress={() => onChange(tab)}><Text style={[styles.farmTabText, isActive && styles.farmTabTextActive]}>{tab}</Text></Pressable>;
      })}
    </View>
    );
}

const styles = StyleSheet.create({
  farmTabBar: { flexDirection: "row", gap: 5, borderRadius: 20, backgroundColor: colors.primary100, padding: 5 },
  farmTab: { flex: 1, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  farmTabActive: { backgroundColor: colors.brandPurple },
  farmTabText: { color: colors.brandPurple, fontSize: 10, fontWeight: "900" },
  farmTabTextActive: { color: colors.white },
});

