import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, shadow, softShadow } from "../theme/theme";
import { FarmHiveCard } from "./FarmHiveCard";
import { EmptyState } from "./ui";
import { FarmHiveItem, FarmRucheFilter } from "../../shared/types/types";

export function FarmRuchesTab({
      search,
      onSearch,
      filter,
      onFilter,
      hives,
      onAdd,
      onSelectHive
    }: {
          search: string;
          onSearch: (value: string) => void;
          filter: FarmRucheFilter;
          onFilter: (value: FarmRucheFilter) => void;
          hives: FarmHiveItem[];
          onAdd: () => void;
          onSelectHive?: (id: string) => void;
        }) {
    return (
    <View style={styles.farmTabContent}>
      <View style={styles.farmSearchBox}>
        <Ionicons name="search-outline" size={15} color={colors.ink400} />
        <TextInput value={search} onChangeText={onSearch} placeholder="Chercher une ruche..." placeholderTextColor={colors.ink400} style={styles.farmSearchInput} />
      </View>
      <View style={styles.farmFilterRow}>
        {(["Tous", "Critique", "Normal"] as FarmRucheFilter[]).map((item) => {
          const active = filter === item;
          return <Pressable key={item} style={[styles.farmFilterChip, active && styles.farmFilterChipActive]} onPress={() => onFilter(item)}><Text style={[styles.farmFilterText, active && styles.farmFilterTextActive]}>{item}</Text></Pressable>;
        })}
      </View>
      {hives.length === 0 ? <EmptyState text="Aucune ruche trouvée." /> : null}
      {hives.map((hive) => <FarmHiveCard key={hive.id} hive={hive} onPress={() => onSelectHive?.(hive.id)} />)}
      <Pressable style={styles.farmFab} onPress={onAdd}><Ionicons name="add" size={28} color={colors.white} /></Pressable>
    </View>
    );
}

const styles = StyleSheet.create({
  farmTabContent: { gap: 12 },
  farmSearchBox: { height: 42, borderRadius: 21, backgroundColor: colors.white, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8, ...softShadow },
  farmSearchInput: { flex: 1, height: 42, color: colors.ink700, fontSize: 12, fontWeight: "700", padding: 0 },
  farmFilterRow: { flexDirection: "row", gap: 8 },
  farmFilterChip: { minHeight: 30, borderRadius: 15, backgroundColor: colors.primary100, paddingHorizontal: 16, justifyContent: "center" },
  farmFilterChipActive: { backgroundColor: colors.brandPurple },
  farmFilterText: { color: colors.brandPurple, fontSize: 10, fontWeight: "900" },
  farmFilterTextActive: { color: colors.white },
  farmFab: { alignSelf: "flex-end", width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brandPurple, alignItems: "center", justifyContent: "center", ...shadow },
});

