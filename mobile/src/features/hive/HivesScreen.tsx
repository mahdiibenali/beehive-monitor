import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Text } from "react-native";
import { AlertHiveCard } from "src/shared/components/AlertHiveCard";
import { AttentionBanner } from "src/shared/components/AttentionBanner";
import { FarmCollectorBanner } from "src/shared/components/FarmCollectorBanner";
import { HomeTopBar } from "src/shared/components/HomeTopBar";
import { TunisiaMapCard } from "src/shared/components/TunisiaMapCard";
import { ErrorBanner, Loading, Screen, EmptyState } from "src/shared/components/ui";
import { colors, shadow, softShadow } from "src/shared/theme/theme";
import { MobileRucheDataPayload, ScreenKey, FarmRucheFilter, FarmHiveItem } from "src/shared/types/types";
import { TIME_FILTERS } from "src/shared/utils/constants";
import { useEndpoint } from "src/shared/utils/helpers";

export function HivesScreen({ onNavigate }: { onNavigate: (screen: ScreenKey, payload?: string) => void }) {
  const [activeTimeFilter, setActiveTimeFilter] = useState<(typeof TIME_FILTERS)[number]>("1M");
  const { data, loading, error, reload } = useEndpoint<MobileRucheDataPayload>(`/mobile/ruche-data?filter=${activeTimeFilter}`, [activeTimeFilter], 5000);
  const farmData = data?.farms ?? [];
  const fermes = farmData.map((item: any) => item.ferme);
  
  // Aggregate all hives from all farms
  const allHives = useMemo(() => {
    return farmData.flatMap((f: any) => f.hives || []);
  }, [farmData]);

  // Aggregate all alerts
  const allAlerts = data?.alerts ?? [];

  // Local State
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FarmRucheFilter>("Tous");
  const [expandedHiveId, setExpandedHiveId] = useState<string | null>(null);

  // Computed
  const criticalCount = allHives.filter((hive: FarmHiveItem) => hive.isCritical).length;
  const activeCollectors = farmData.reduce((acc: number, f: any) => acc + (f.collecteursActifs || 0), 0);

  const filteredHives = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allHives.filter((hive: FarmHiveItem) => {
      const matchesSearch = !query || hive.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (filter === "Critique") return hive.isCritical;
      if (filter === "Normal") return !hive.isCritical;
      return true;
    });
  }, [filter, allHives, search]);

  return (
    <View style={{ flex: 1 }}>
      <Screen style={styles.screenContent}>
        <HomeTopBar
          onRefresh={reload}
          onNotifications={() => onNavigate("notifications")}
          onProfile={() => onNavigate("profile")}
          hasNotifications={criticalCount > 0}
        />
        
        {loading ? <Loading /> : null}
        {error ? <ErrorBanner message={error} /> : null}

        {!loading && !error ? (
          <>
            {fermes.length > 0 && (
               <TunisiaMapCard
                 fermes={fermes}
                 selectedFarm="Tous"
                 onSelectFarm={() => {}}
                 onOpen={() => {}}
               />
            )}

            <AttentionBanner count={criticalCount} onPress={() => setFilter("Critique")} />
            
            <FarmCollectorBanner active={activeCollectors} />

            {/* Search and Filters */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={15} color={colors.ink400} />
              <TextInput 
                value={search} 
                onChangeText={setSearch} 
                placeholder="Rechercher une ruche..." 
                placeholderTextColor={colors.ink400} 
                style={styles.searchInput} 
              />
            </View>
            <View style={styles.filterRow}>
              {(["Tous", "Critique", "Normal"] as FarmRucheFilter[]).map((item) => {
                const active = filter === item;
                const displayLabel = item === "Normal" ? "Normale" : item;
                return (
                  <Pressable 
                    key={item} 
                    style={[styles.filterChip, active && styles.filterChipActive]} 
                    onPress={() => setFilter(item)}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {displayLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {filteredHives.length === 0 ? <EmptyState text="Aucune ruche trouvée." /> : null}

            {/* Hives List */}
            <View style={styles.hivesList}>
              {filteredHives.map((hive: FarmHiveItem) => (
                <AlertHiveCard
                  key={hive.id}
                  hive={hive}
                  alerts={allAlerts.filter((a: any) => a.hiveId === hive.id || a.location?.includes(hive.name))}
                  onPress={() => onNavigate("hive", hive.id)}
                />
              ))}
            </View>
          </>
        ) : null}
      </Screen>

      {/* Floating Add Button */}
      {!loading && !error && (
        <Pressable style={styles.fab} onPress={() => onNavigate("gateway")}>
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingTop: 32, gap: 12 },
  searchBox: { 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: colors.white, 
    paddingHorizontal: 14, 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    ...softShadow 
  },
  searchInput: { 
    flex: 1, 
    height: 42, 
    color: colors.ink700, 
    fontSize: 12, 
    fontWeight: "700", 
    padding: 0 
  },
  filterRow: { 
    flexDirection: "row", 
    gap: 8,
    backgroundColor: colors.white,
    padding: 6,
    borderRadius: 24,
    ...softShadow
  },
  filterChip: { 
    flex: 1,
    minHeight: 36, 
    borderRadius: 18, 
    backgroundColor: "transparent", 
    paddingHorizontal: 16, 
    alignItems: "center",
    justifyContent: "center" 
  },
  filterChipActive: { 
    backgroundColor: colors.primary100 
  },
  filterText: { 
    color: colors.brandPurple, 
    fontSize: 12, 
    fontWeight: "600" 
  },
  filterTextActive: { 
    color: colors.brandPurple,
    fontWeight: "800"
  },
  hivesList: { gap: 12 },
  fab: { 
    position: "absolute",
    bottom: 110, // Above bottom nav
    right: 30, // Above the cube icon slightly
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: colors.brandPurple, 
    alignItems: "center", 
    justifyContent: "center", 
    ...shadow 
  },
});
