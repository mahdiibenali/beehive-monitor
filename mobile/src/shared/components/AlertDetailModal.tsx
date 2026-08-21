import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "../theme/theme";
import { MobileAlertItem, MobileFarmData } from "../types/types";
import { buildLeafletHtml } from "../utils/helpers";
import { NotificationAlertRow } from "./NotificationAlertRow";

export function AlertDetailModal({ visible, alert, farms = [], onClose }: { visible: boolean; alert: MobileAlertItem | null; farms: MobileFarmData[]; onClose: () => void }) {
    if (!alert) return null;
    const farmData = farms.find(f => f.ferme.nom === alert.farmName);
    const lat = farmData?.ferme?.lat ?? 36.0396;
    const lng = farmData?.ferme?.lng ?? 9.5375;
    return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, backgroundColor: colors.ink200, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
          
          <View style={{ backgroundColor: "#E6EAFF", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View style={{ backgroundColor: colors.white, padding: 6, borderRadius: 8, marginRight: 12 }}>
              <Ionicons name="layers-outline" size={16} color={colors.brandPurple} />
            </View>
            <Text style={{ flex: 1, color: colors.brandPurple, fontSize: 13, fontWeight: "600" }}>
              Ruche {'>'} Gateway 22 {'>'} {alert.farmName.split(' ')[0]}
            </Text>
            <View style={{ backgroundColor: colors.brandPurple, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="location" size={16} color={colors.white} />
            </View>
          </View>

          <View style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, height: 200, position: "relative" }}>
            <WebView
              style={{ flex: 1, backgroundColor: "#DDEBFA" }}
              source={{ html: buildLeafletHtml([{ id: alert.id, latitude: lat, longitude: lng, isCritical: alert.tone === "red" }]) }}
              originWhitelist={["*"]}
              javaScriptEnabled
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
            />
            <View style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="expand" size={14} color={colors.brandPurple} />
            </View>
          </View>

          <NotificationAlertRow alert={alert} selectable={false} />
        </View>
      </View>
    </Modal>
    );
}
