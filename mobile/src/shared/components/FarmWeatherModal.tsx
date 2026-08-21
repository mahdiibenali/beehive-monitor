import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadow, softShadow } from "../theme/theme";
import { FermeListItem, MobileWeather } from "../types/types";
import { FarmWeatherCard } from "./FarmWeatherCard";
import { Button } from "./ui";

export function FarmWeatherModal({
      visible,
      onClose,
      farm,
      weather
    }: {
          visible: boolean;
          onClose: () => void;
          farm?: FermeListItem;
          weather?: MobileWeather;
        }) {
    const days = ["Auj", "Dim", "Lun", "Mar", "Mer", "Jeu"];
    return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.farmModalOverlay}><View style={styles.farmWeatherModal}><View style={styles.farmWeatherModalHeader}><Pressable style={styles.backCircle} onPress={onClose}><Ionicons name="chevron-back" size={20} color={colors.brandPurple} /></Pressable><Text style={styles.farmSystemTitle}>Meteo details</Text><View style={{ width: 44 }} /></View><FarmWeatherCard farm={farm} weather={weather} onDetails={() => undefined} /><View style={styles.farmForecastRow}>{days.map((day, index) => <View key={day} style={styles.farmForecastDay}><Ionicons name={index % 2 ? "partly-sunny-outline" : "rainy-outline"} size={18} color={colors.brandPurple} /><Text style={styles.farmForecastText}>{day}</Text><Text style={styles.farmForecastTemp}>{typeof weather?.currentTemp === "number" ? `${weather.currentTemp}°` : "--"}</Text></View>)}</View><Button onPress={onClose}>Moins de details</Button></View></View>
    </Modal>
    );
}

const styles = StyleSheet.create({
  farmModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 24 },
  farmWeatherModal: { width: "100%", borderRadius: 22, backgroundColor: colors.white, padding: 14, gap: 14, ...shadow },
  farmWeatherModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
        ...softShadow
      },
  farmSystemTitle: { color: colors.ink800, fontSize: 13, fontWeight: "900" },
  farmForecastRow: { flexDirection: "row", gap: 7 },
  farmForecastDay: { flex: 1, minHeight: 72, borderRadius: 14, backgroundColor: colors.primary100, alignItems: "center", justifyContent: "center", gap: 3 },
  farmForecastText: { color: colors.ink500, fontSize: 9, fontWeight: "900" },
  farmForecastTemp: { color: colors.brandPurple, fontSize: 11, fontWeight: "900" },
});

