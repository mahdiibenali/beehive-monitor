import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadow } from "../theme/theme";
import { FermeListItem } from "../types/types";
import { shortFarmName } from "../utils/helpers";
import { TunisiaMapCard } from "./TunisiaMapCard";

export function FarmSelector({
      fermes,
      selectedFarm,
      onSelect,
      onOpenMap
    }: {
          fermes: FermeListItem[];
          selectedFarm?: FermeListItem;
          onSelect: (id: string) => void;
          onOpenMap: () => void;
        }) {
    return (
    <View style={styles.farmSelectorCard}>
      <TunisiaMapCard fermes={selectedFarm ? [selectedFarm] : fermes} selectedFarm="Tous" onSelectFarm={() => undefined} onOpen={onOpenMap} />
      <View style={styles.farmSelectRow}>
        <View style={styles.farmSelectIcon}><Ionicons name="leaf-outline" size={16} color={colors.brandPurple} /></View>
        <Text style={styles.farmSelectText} numberOfLines={1}>{selectedFarm?.nom ?? "Senyet Garir"}</Text>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.farmLocationButton} onPress={onOpenMap}><Ionicons name="location" size={17} color={colors.white} /></Pressable>
      </View>
      <View style={styles.farmMiniPickerRow}>
        {fermes.slice(0, 4).map((ferme) => {
          const active = ferme.id === selectedFarm?.id;
          return (
            <Pressable key={ferme.id} style={[styles.farmMiniChip, active && styles.farmMiniChipActive]} onPress={() => onSelect(ferme.id)}>
              <Text style={[styles.farmMiniChipText, active && styles.farmMiniChipTextActive]} numberOfLines={1}>{shortFarmName(ferme.nom)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  farmSelectorCard: { gap: 8 },
  farmSelectRow: { minHeight: 52, borderRadius: 14, backgroundColor: colors.brandOrange, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10, ...shadow },
  farmSelectIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  farmSelectText: { color: colors.white, fontSize: 14, fontWeight: "900" },
  farmLocationButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brandPurple, alignItems: "center", justifyContent: "center" },
  farmMiniPickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  farmMiniChip: { maxWidth: 92, minHeight: 26, borderRadius: 13, paddingHorizontal: 10, backgroundColor: colors.primary100, justifyContent: "center" },
  farmMiniChipActive: { backgroundColor: colors.brandPurple },
  farmMiniChipText: { color: colors.brandPurple, fontSize: 10, fontWeight: "800" },
  farmMiniChipTextActive: { color: colors.white },
});

