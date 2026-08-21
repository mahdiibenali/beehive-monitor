import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { FermeListItem, MobileWeather } from "../types/types";
import { formatMaybeNumber } from "../utils/helpers";
import { FarmWeatherMetric } from "./FarmWeatherMetric";

export function FarmWeatherCard({
      farm,
      weather,
      onDetails
    }: {
          farm?: FermeListItem;
          weather?: MobileWeather;
          onDetails: () => void;
        }) {
    return (
    <View style={styles.farmWeatherCard}>
      <View style={styles.farmWeatherTop}>
        <View style={styles.farmWeatherIcon}><Ionicons name="cloudy-night-outline" size={24} color={colors.brandPurple} /></View>
        <View style={{ flex: 1 }}>
          <View style={styles.farmWeatherTempRow}>
            <Text style={styles.farmWeatherTemp}>{formatMaybeNumber(weather?.currentTemp, "°")}</Text>
            <Text style={styles.farmWeatherPlace} numberOfLines={1}>{weather?.location || farm?.region || farm?.nom || "--"}</Text>
          </View>
          <View style={styles.farmWeatherStatsRow}>
            <FarmWeatherMetric icon="rainy-outline" value={formatMaybeNumber(weather?.precipitationMm, "mm")} />
            <FarmWeatherMetric icon="water-outline" value={formatMaybeNumber(weather?.humidityPct, "%")} />
            <FarmWeatherMetric icon="navigate-outline" value={formatMaybeNumber(weather?.windKmh, " km/h")} />
          </View>
        </View>
      </View>
      <Pressable style={styles.farmDetailsButton} onPress={onDetails}><Text style={styles.farmDetailsText}>Details</Text></Pressable>
    </View>
    );
}

const styles = StyleSheet.create({
  farmWeatherCard: { borderRadius: 16, backgroundColor: colors.white, padding: 12, gap: 10, ...softShadow },
  farmWeatherTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  farmWeatherIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary100, alignItems: "center", justifyContent: "center" },
  farmWeatherTempRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  farmWeatherTemp: { color: colors.ink800, fontSize: 28, lineHeight: 32, fontWeight: "900" },
  farmWeatherPlace: { flex: 1, color: colors.ink500, fontSize: 11, fontWeight: "700" },
  farmWeatherStatsRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  farmDetailsButton: { height: 36, borderRadius: 18, backgroundColor: colors.brandPurple, alignItems: "center", justifyContent: "center" },
  farmDetailsText: { color: colors.white, fontSize: 11, fontWeight: "900" },
});

