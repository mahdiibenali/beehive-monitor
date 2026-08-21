import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, PanResponder, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "src/services/api";
import { colors } from "../theme/theme";
import { messageFromError } from "../utils/helpers";

export function AddVeninModal({
      visible,
      onClose,
      farmId,
      gatewayId,
      hives = [],
      onSuccess
    }: {
          visible: boolean;
          onClose: () => void;
          farmId: string;
          gatewayId?: string;
          hives?: { id: string; name: string }[];
          onSuccess: () => void;
        }) {
    const [mg, setMg] = useState<string>("0");
    const [selectedHiveId, setSelectedHiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const panY = useRef(new Animated.Value(0)).current;
    useEffect(() => {
    if (visible) {
      panY.setValue(0);
      setMg("0");
    }
    }, [visible]);
    const resetPositionAnim = Animated.timing(panY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          });
    const closeAnim = Animated.timing(panY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          });
    const panResponder = useRef(
            PanResponder.create({
              onStartShouldSetPanResponder: () => false,
              onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 5 && Math.abs(gestureState.dx) < 10;
              },
              onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                  panY.setValue(gestureState.dy);
                }
              },
              onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120 || gestureState.vy > 0.4) {
                  closeAnim.start(() => {
                    onClose();
                  });
                } else {
                  resetPositionAnim.start();
                }
              },
            })
          ).current;
    const handleSubmit = async () => {
            const mgValue = parseInt(mg, 10);
            if (isNaN(mgValue) || mgValue <= 0 || !selectedHiveId) return;
            try {
              setLoading(true);
              const now = new Date();
              await api.post("/mobile/sessions", {
                farmId,
                gatewayId,
                date: now.toISOString().split("T")[0],
                time: now.toTimeString().split(" ")[0].slice(0, 5),
                grams: mgValue / 1000,
                hiveId: selectedHiveId
              });
              onSuccess();
              onClose();
              setMg("0");
              setSelectedHiveId(null);
            } catch (err) {
              alert("Erreur: " + messageFromError(err));
            } finally {
              setLoading(false);
            }
          };
    const translateY = panY;
    const parsedMg = parseInt(mg, 10) || 0;
    return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={onClose}>
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateY }],
            backgroundColor: colors.white,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 24,
            paddingBottom: 48
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.ink200, borderRadius: 2, alignSelf: "center", marginBottom: 24 }} />
            
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.ink900, textAlign: "center", marginBottom: 24 }}>Ajout de venin collecté (mg)</Text>
            
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.ink900, marginBottom: 12 }}>Sélectionner la ruche</Text>
            <View style={{ marginBottom: 24, height: 40 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {hives.map(hive => {
                  const isSelected = selectedHiveId === hive.id;
                  return (
                    <Pressable 
                      key={hive.id} 
                      onPress={() => setSelectedHiveId(hive.id)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isSelected ? colors.brandPurple : colors.ink100,
                        marginRight: 8,
                        height: 36,
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: isSelected ? colors.white : colors.ink700, fontWeight: "600" }}>{hive.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ backgroundColor: colors.ink50, borderRadius: 24, padding: 24, marginBottom: 24, alignItems: "center" }}>
              <TextInput
                value={mg}
                onChangeText={(text) => setMg(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={{ fontSize: 64, fontWeight: "bold", color: colors.brandPurple, textAlign: "center", minWidth: 150 }}
                placeholder="0"
                placeholderTextColor={colors.brandPurple}
              />
            </View>
            
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 48 }}>
              <Pressable
                onPress={() => setMg(Math.max(0, parsedMg - 1).toString())}
                style={{ flex: 1, marginRight: 8, height: 60, borderWidth: 2, borderColor: colors.brandPurple, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.brandPurple }}>-</Text>
              </Pressable>
              <Pressable
                onPress={() => setMg((parsedMg + 1).toString())}
                style={{ flex: 1, marginLeft: 8, height: 60, backgroundColor: colors.brandPurple, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.white }}>+</Text>
              </Pressable>
            </View>
            
            <Pressable
              disabled={loading || parsedMg <= 0 || !selectedHiveId}
              onPress={handleSubmit}
              style={{ backgroundColor: (loading || parsedMg <= 0 || !selectedHiveId) ? colors.ink400 : colors.brandOrange, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.white }}>
                {loading ? "Chargement..." : "Confirmer"}
              </Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
    );
}
