import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View, Image } from "react-native";
import { colors, softShadow } from "../theme/theme";

export function HomeTopBar({
      onRefresh,
      onNotifications,
      onProfile,
      hasNotifications = false,
      onBack
    }: {
          onRefresh?: () => void;
          onNotifications: () => void;
          onProfile: () => void;
          hasNotifications?: boolean;
          onBack?: () => void;
        }) {
    return (
    <View style={styles.venomTopBar}>
      <Pressable style={onBack ? styles.backCircle : styles.venomLogo} onPress={onBack ?? onRefresh}>
        {onBack ? (
          <Ionicons name="chevron-back" size={22} color={colors.brandPurple} />
        ) : (
          <Image source={require("../../../assets/images/logo.png")} style={{ width: 46, height: 46, borderRadius: 15 }} />
        )}
      </Pressable>
      <View style={styles.venomTopActions}>
        <Pressable style={styles.topCircle} onPress={onNotifications}>
          <Ionicons name="notifications-outline" size={20} color={colors.brandPurple} />
          {hasNotifications ? <View style={styles.notificationDot} /> : null}
        </Pressable>
        <Pressable style={styles.topCircle} onPress={onProfile}>
          <Ionicons name="person-outline" size={20} color={colors.brandPurple} />
        </Pressable>
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  venomTopBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6
      },
  backCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
        ...softShadow
      },
  venomLogo: {
        width: 46,
        height: 46,
        borderRadius: 15,
        backgroundColor: colors.brandOrange,
        alignItems: "center",
        justifyContent: "center",
        ...softShadow
      },
  venomTopActions: {
        flexDirection: "row",
        gap: 12
      },
  topCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
        ...softShadow
      },
  notificationDot: {
        position: "absolute",
        top: 10,
        right: 11,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.danger,
        borderWidth: 1.5,
        borderColor: colors.white
      },
});

