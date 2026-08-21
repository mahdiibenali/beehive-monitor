import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { FermeListItem, MapStatusFilter } from "../types/types";
import { HomeTopBar } from "./HomeTopBar";
import { TunisiaMapCard } from "./TunisiaMapCard";
import { ErrorBanner, Loading, Screen } from "./ui";

export function MapExplorerView({
      fermes,
      loading,
      error,
      search,
      onSearch,
      statusFilter,
      onStatusFilter,
      onBack,
      onNotifications,
      onProfile,
      onSelectFarm
    }: {
          fermes: FermeListItem[];
          loading: boolean;
          error: string | null;
          search: string;
          onSearch: (value: string) => void;
          statusFilter: MapStatusFilter;
          onStatusFilter: (value: MapStatusFilter) => void;
          onBack: () => void;
          onNotifications: () => void;
          onProfile: () => void;
          onSelectFarm?: (id: string) => void;
        }) {
    const visibleFermes = useMemo(() => {
            const query = search.trim().toLowerCase();
            return fermes.filter((ferme) => {
              const matchesSearch =
                !query ||
                ferme.nom.toLowerCase().includes(query) ||
                ferme.region.toLowerCase().includes(query) ||
                ferme.pays.toLowerCase().includes(query);
              if (!matchesSearch) return false;
              if (statusFilter === "Critique") return ferme.ruchesAttention > 0 || ferme.status === "alerte";
              if (statusFilter === "Normale") return ferme.ruchesAttention === 0 && ferme.status !== "alerte";
              return true;
            });
          }, [fermes, search, statusFilter]);
    return (
    <Screen style={styles.mapExplorerScreen}>
      <HomeTopBar
        onBack={onBack}
        onNotifications={onNotifications}
        onProfile={onProfile}
        hasNotifications={fermes.some((ferme) => ferme.ruchesAttention > 0)}
      />
      {loading ? <Loading /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      <View style={styles.mapSearchBox}>
        <Ionicons name="search-outline" size={15} color={colors.ink400} />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder="Rechercher une ferme"
          placeholderTextColor={colors.ink400}
          style={styles.mapSearchInput}
        />
      </View>
      <View style={styles.mapStatusRow}>
        {(["Tous", "Critique", "Normale"] as MapStatusFilter[]).map((filter) => {
          const active = statusFilter === filter;
          return (
            <Pressable
              key={filter}
              style={[styles.mapStatusChip, active && styles.mapStatusChipActive]}
              onPress={() => onStatusFilter(filter)}
            >
              <Text style={[styles.mapStatusText, active && styles.mapStatusTextActive]}>{filter}</Text>
            </Pressable>
          );
        })}
      </View>
      <TunisiaMapCard
        fermes={visibleFermes}
        selectedFarm="Tous"
        onSelectFarm={(id) => {
          if (id !== "Tous" && onSelectFarm) {
            onSelectFarm(id);
          }
        }}
        onOpen={() => undefined}
        large
      />
    </Screen>
    );
}

const styles = StyleSheet.create({
  mapExplorerScreen: {
        paddingTop: 32,
        gap: 12,
        paddingHorizontal: 24
      },
  mapSearchBox: {
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.white,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        ...softShadow
      },
  mapSearchInput: {
        flex: 1,
        height: 40,
        color: colors.ink700,
        fontSize: 12,
        fontWeight: "700",
        padding: 0
      },
  mapStatusRow: {
        flexDirection: "row",
        gap: 8,
        backgroundColor: colors.primary100,
        borderRadius: 20,
        padding: 4
      },
  mapStatusChip: {
        flex: 1,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center"
      },
  mapStatusChipActive: {
        backgroundColor: colors.brandPurple
      },
  mapStatusText: {
        color: colors.brandPurple,
        fontSize: 11,
        fontWeight: "900"
      },
  mapStatusTextActive: {
        color: colors.white
      },
});

