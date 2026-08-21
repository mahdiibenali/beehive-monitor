import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import { colors, softShadow } from "../theme/theme";
import { FermeListItem } from "../types/types";
import { buildFarmMarkers, buildLeafletHtml, shortFarmName } from "../utils/helpers";

export function TunisiaMapCard({
      fermes,
      selectedFarm,
      onSelectFarm,
      onOpen,
      large = false
    }: {
          fermes: FermeListItem[];
          selectedFarm: string;
          onSelectFarm: (farm: string) => void;
          onOpen: () => void;
          large?: boolean;
        }) {
    const chips = ["Tous", ...fermes.map((ferme) => shortFarmName(ferme.nom))];
    const displayedFermes = selectedFarm === "Tous"
            ? fermes
            : fermes.filter((ferme) => shortFarmName(ferme.nom) === selectedFarm);
    const markerSource = displayedFermes.length > 0 ? displayedFermes : fermes;
    const markers = useMemo(() => buildFarmMarkers(markerSource), [markerSource]);
    const mapHtml = useMemo(() => buildLeafletHtml(markers), [markers]);
    return (
    <View style={[styles.homeMapCard, large && styles.homeMapCardLarge]}>
      {!large ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeMapChipRow}>
          {chips.map((chip, index) => {
            const active = selectedFarm === chip;
            return (
              <Pressable
                key={chip + String(index)}
                style={[styles.homeMapChip, active && styles.homeMapChipActive]}
                onPress={() => onSelectFarm(chip)}
              >
                <Text style={[styles.homeMapChipText, active && styles.homeMapChipTextActive]} numberOfLines={1}>
                  {chip}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      <View style={[styles.homeMapFrame, large && styles.homeMapFrameLarge]}>
        <WebView
          style={styles.realMap}
          source={{ html: mapHtml }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={large}
          nestedScrollEnabled={large}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          onMessage={(event) => {
            if (onSelectFarm) onSelectFarm(event.nativeEvent.data);
          }}
        />
        {!large ? (
          <Pressable style={styles.mapPreviewTapLayer} onPress={onOpen}>
            <View style={styles.mapExpandButton}>
              <Ionicons name="scan-outline" size={16} color={colors.brandPurple} />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  homeMapCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 8,
        gap: 8,
        ...softShadow
      },
  homeMapCardLarge: {
        padding: 0,
        borderRadius: 0,
        backgroundColor: "transparent",
        shadowOpacity: 0,
        elevation: 0
      },
  homeMapChipRow: {
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: 2
      },
  homeMapChip: {
        maxWidth: 92,
        minHeight: 27,
        borderRadius: 14,
        paddingHorizontal: 10,
        backgroundColor: colors.primary100,
        alignItems: "center",
        justifyContent: "center"
      },
  homeMapChipActive: {
        backgroundColor: colors.brandPurple
      },
  homeMapChipText: {
        color: colors.brandPurple,
        fontSize: 10,
        fontWeight: "800"
      },
  homeMapChipTextActive: {
        color: colors.white
      },
  homeMapFrame: {
        height: 164,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#DDEBFA"
      },
  homeMapFrameLarge: {
        height: 420,
        borderRadius: 0
      },
  realMap: {
        width: "100%",
        height: "100%"
      },
  mapPreviewTapLayer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "flex-end",
        padding: 8
      },
  mapExpandButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.9)",
        alignItems: "center",
        justifyContent: "center"
      },
});

