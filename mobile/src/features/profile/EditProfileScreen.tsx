import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, Modal, FlatList } from "react-native";
import { useAuth } from "src/core/providers/AuthContext";
import { Screen } from "src/shared/components/ui";
import { colors, softShadow } from "src/shared/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { ScreenKey } from "src/shared/types/types";
import { api } from "src/services/api";

const TUNISIA_REGIONS = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan",
  "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba", "Médenine", "Monastir",
  "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"
];

export function EditProfileScreen({ onNavigate }: { onNavigate: (s: ScreenKey) => void }) {
  const { user, setUser } = useAuth();
  
  const [name, setName] = useState(user?.name ?? "");
  const [genre, setGenre] = useState(user?.genre ?? "");
  const [region, setRegion] = useState(user?.region ?? "");
  const [loading, setLoading] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const response = await api.patch("/auth/profile", { name, genre, region });
      setUser(response.data.user);
      Alert.alert("Succès", "Profil mis à jour.");
      onNavigate("profile");
    } catch (err: any) {
      Alert.alert("Erreur", err?.response?.data?.error || "Erreur de mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const renderRegionPicker = () => (
    <Modal visible={showRegionPicker} animationType="fade" transparent={true} onRequestClose={() => setShowRegionPicker(false)}>
      <Pressable style={styles.pickerOverlay} onPress={() => setShowRegionPicker(false)}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Sélectionner une région</Text>
          <FlatList
            data={TUNISIA_REGIONS}
            keyExtractor={(item) => item}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => (
              <Pressable style={styles.pickerItem} onPress={() => { setRegion(item); setShowRegionPicker(false); }}>
                <Text style={[styles.pickerItemText, region === item && { color: colors.brandPurple, fontWeight: "bold" }]}>{item}</Text>
                {region === item && <Ionicons name="checkmark" size={20} color={colors.brandPurple} />}
              </Pressable>
            )}
          />
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => onNavigate("profile")}>
            <Ionicons name="chevron-back" size={24} color={colors.brandPurple} />
          </Pressable>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={38} color={colors.brandPurple} />
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color={colors.white} />
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom et Prénom</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={16} color={colors.ink400} style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Votre nom"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={16} color={colors.ink400} style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput}
                value={user?.email || ""}
                editable={false}
                pointerEvents="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Genre</Text>
            <View style={styles.genreRow}>
              <Pressable 
                style={[styles.genreBox, genre === "Homme" && styles.genreBoxActive]} 
                onPress={() => setGenre("Homme")}
              >
                <Ionicons name="male" size={28} color={genre === "Homme" ? colors.brandPurple : colors.ink400} />
                <Text style={[styles.genreText, genre === "Homme" && styles.genreTextActive]}>Homme</Text>
              </Pressable>
              <Pressable 
                style={[styles.genreBox, genre === "Femelle" && styles.genreBoxActive]} 
                onPress={() => setGenre("Femelle")}
              >
                <Ionicons name="female" size={28} color={genre === "Femelle" ? colors.brandPurple : colors.ink400} />
                <Text style={[styles.genreText, genre === "Femelle" && styles.genreTextActive]}>Femelle</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Région</Text>
            <Pressable style={styles.inputWrapper} onPress={() => setShowRegionPicker(true)}>
              <Ionicons name="location-outline" size={16} color={colors.ink400} style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput}
                value={region}
                placeholder="Sélectionner une région"
                editable={false}
                pointerEvents="none"
              />
              <Ionicons name="caret-down" size={14} color={colors.ink800} />
            </Pressable>
          </View>

          <View style={styles.formButtonsRow}>
            <Pressable style={styles.confirmButton} onPress={save} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.confirmButtonText}>Confirmer</Text>}
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => onNavigate("profile")} disabled={loading}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      {renderRegionPicker()}
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
  editBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: "#F28C28", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
  formCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, gap: 16, ...softShadow, marginBottom: 20 },
  inputGroup: { gap: 6 },
  label: { color: colors.ink500, fontSize: 14, fontWeight: "700" },
  inputWrapper: { height: 48, borderRadius: 14, backgroundColor: "#F8F9FB", flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, minHeight: 48, paddingVertical: 0, color: colors.ink800, fontSize: 14, fontWeight: "600" },
  genreRow: { flexDirection: "row", gap: 12 },
  genreBox: { flex: 1, height: 90, borderRadius: 16, borderWidth: 2, borderColor: "#F0F0F0", alignItems: "center", justifyContent: "center", gap: 6 },
  genreBoxActive: { borderColor: "#7D8CDB", backgroundColor: "#F9F8FD" },
  genreText: { fontSize: 14, color: colors.ink400, fontWeight: "600" },
  genreTextActive: { color: "#7D8CDB" },
  formButtonsRow: { marginTop: 8, gap: 12 },
  confirmButton: { height: 52, backgroundColor: colors.brandPurple, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  confirmButtonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  cancelButton: { height: 52, alignItems: "center", justifyContent: "center" },
  cancelButtonText: { color: "#7D8CDB", fontSize: 16, fontWeight: "600" },
  /* Picker Styles */
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  pickerContainer: { backgroundColor: colors.white, borderRadius: 16, padding: 20, ...softShadow },
  pickerTitle: { fontSize: 18, fontWeight: "700", color: colors.ink800, marginBottom: 16, textAlign: "center" },
  pickerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  pickerItemText: { fontSize: 16, color: colors.ink800 },
});
