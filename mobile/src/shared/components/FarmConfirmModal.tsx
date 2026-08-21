import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadow } from "../theme/theme";

export function FarmConfirmModal({ mode, onClose }: { mode: "start" | "delete" | null; onClose: () => void }) {
    if (!mode) return null;
    const isDelete = mode === "delete";
    return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.farmModalOverlay}>
        <View style={styles.farmConfirmModal}>
          <Pressable style={styles.farmModalClose} onPress={onClose}>
            <Ionicons name="close" size={26} color="#A8AAC0" />
          </Pressable>
          <View style={styles.contentWrapper}>
            <Text style={styles.farmConfirmTitle}>
              {isDelete ? "Supprimer la session ?" : "Ajouter une session planifiée ?"}
            </Text>
            <Text style={styles.farmConfirmText}>
              {isDelete ? (
                "Confirmez-vous la suppression de la session automatique du collecteur de venin ?"
              ) : (
                <Text>
                  Confirmer l'ajout de la session planifiée du <Text style={styles.boldText}>lun. 12/06</Text> à <Text style={styles.boldText}>09:40</Text> pour le déclenchement du collecteur de venin ?
                </Text>
              )}
            </Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.buttonsWrapper}>
            <Pressable style={styles.farmCancelButton} onPress={onClose}>
              <Text style={styles.farmCancelText}>Annuler</Text>
            </Pressable>
            <Pressable style={[styles.farmConfirmButton, isDelete && styles.farmDeleteConfirmButton]} onPress={onClose}>
              <Text style={styles.farmConfirmButtonText}>{isDelete ? "Supprimer" : "Confirmer"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    );
}

const styles = StyleSheet.create({
  farmModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  farmConfirmModal: { width: "100%", maxWidth: 360, borderRadius: 28, backgroundColor: colors.white, paddingTop: 40, paddingBottom: 24, ...shadow },
  farmModalClose: { position: "absolute", top: 16, right: 16, padding: 4, zIndex: 10 },
  contentWrapper: { paddingHorizontal: 30, alignItems: "center" },
  farmConfirmTitle: { color: "#110D3B", fontSize: 19, fontWeight: "900", textAlign: "center", marginBottom: 16 },
  farmConfirmText: { color: "#8287A0", fontSize: 14, lineHeight: 24, fontWeight: "500", textAlign: "center" },
  boldText: { fontWeight: "800", color: "#6A718F" },
  separator: { width: "100%", height: 1, backgroundColor: "#EBEFFA", marginTop: 24, marginBottom: 24 },
  buttonsWrapper: { flexDirection: "row", gap: 16, paddingHorizontal: 24 },
  farmCancelButton: { flex: 1, height: 54, borderRadius: 27, backgroundColor: "#EDF0FF", alignItems: "center", justifyContent: "center" },
  farmCancelText: { color: "#9CA8E3", fontSize: 16, fontWeight: "800" },
  farmConfirmButton: { flex: 1, height: 54, borderRadius: 27, backgroundColor: "#7B88E3", alignItems: "center", justifyContent: "center" },
  farmDeleteConfirmButton: { backgroundColor: colors.danger },
  farmConfirmButtonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
});

