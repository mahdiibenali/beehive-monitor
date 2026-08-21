import React, { useEffect } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput } from "react-native";
import { useAuth } from "src/core/providers/AuthContext";
import { Screen } from "src/shared/components/ui";
import { colors, softShadow } from "src/shared/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { ScreenKey } from "src/shared/types/types";

export function ProfileScreen({ onNavigate }: { onNavigate: (s: ScreenKey) => void }) {
  const { user, logout, refresh } = useAuth();

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  return (
    <Screen style={styles.screen} contentContainerStyle={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => onNavigate("dashboard")}>
            <Ionicons name="chevron-back" size={24} color={colors.brandPurple} />
          </Pressable>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={38} color={colors.brandPurple} />
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom et Prénom</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={16} color={colors.ink400} style={styles.inputIcon} />
              <TextInput style={styles.textInput} value={user?.name || ""} editable={false} pointerEvents="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={16} color={colors.ink400} style={styles.inputIcon} />
              <TextInput style={styles.textInput} value={user?.email || ""} editable={false} pointerEvents="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Genre</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="people-outline" size={16} color={colors.ink400} style={styles.inputIcon} />
              <TextInput style={styles.textInput} value={user?.genre || "Non spécifié"} editable={false} pointerEvents="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Région</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={16} color={colors.ink400} style={styles.inputIcon} />
              <TextInput style={styles.textInput} value={user?.region || "Non spécifié"} editable={false} pointerEvents="none" />
            </View>
          </View>

          <View style={styles.formButtonsRow}>
            <Pressable style={styles.confirmButton} onPress={() => onNavigate("editProfile" as any)}>
              <Text style={styles.confirmButtonText}>Modifier</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 40, backgroundColor: "#F7F2EC", paddingBottom: 0 },
  scrollContent: { paddingHorizontal: 8, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EBE3FC", alignItems: "center", justifyContent: "center" },
  profileSection: { alignItems: "center", marginBottom: 12 },
  avatarWrapper: { position: "relative", marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", ...softShadow },
  formCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, gap: 16, ...softShadow },
  inputGroup: { gap: 6 },
  label: { color: colors.ink500, fontSize: 14, fontWeight: "700" },
  inputWrapper: { height: 48, borderRadius: 14, backgroundColor: "#F8F9FB", flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, minHeight: 48, paddingVertical: 0, color: colors.ink800, fontSize: 14, fontWeight: "600" },
  formButtonsRow: { marginTop: 8 },
  confirmButton: { height: 52, backgroundColor: colors.brandPurple, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  confirmButtonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  logoutButton: { height: 52, backgroundColor: "#FF3B0A", borderRadius: 26, alignItems: "center", justifyContent: "center" },
  logoutText: { color: "white", fontSize: 16, fontWeight: "700" },
});