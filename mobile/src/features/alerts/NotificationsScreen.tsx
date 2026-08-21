import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "src/services/api";
import { AlertDetailModal } from "src/shared/components/AlertDetailModal";
import { NotificationAlertRow } from "src/shared/components/NotificationAlertRow";
import { EmptyState, Loading, Screen } from "src/shared/components/ui";
import { colors, softShadow } from "src/shared/theme/theme";
import { MobileAlertItem, MobileRucheDataPayload, ScreenKey } from "src/shared/types/types";
import { messageFromError, useEndpoint } from "src/shared/utils/helpers";

export function NotificationsScreen({ onNavigate }: { onNavigate?: (screen: ScreenKey) => void }) {
    const { data, loading, error, reload } = useEndpoint<MobileRucheDataPayload>("/mobile/ruche-data");
    const { data: notifData, loading: notifLoading } = useEndpoint<{ items: any[] }>("/notifications");
    const [activeTab, setActiveTab] = useState<"alertes" | "notifications">("alertes");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Tous les états");
    const [categoryFilter, setCategoryFilter] = useState("Tous");
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedAlert, setSelectedAlert] = useState<MobileAlertItem | null>(null);
    const alerts = data?.alerts || [];
    const visibleAlerts = alerts.filter(a => {
            if (statusFilter !== "Tous les états" && statusFilter !== a.status) return false;
            if (categoryFilter !== "Tous") {
              if (a.category && a.category !== "autre") {
                if (a.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
              } else {
                if (categoryFilter === "Batterie" && !a.title.toLowerCase().includes("batterie")) return false;
                if (categoryFilter === "Capteur" && !a.title.toLowerCase().includes("pression") && !a.title.toLowerCase().includes("capteur")) return false;
                if (categoryFilter === "Venin" && !a.title.toLowerCase().includes("venin")) return false;
              }
            }
            if (search.trim()) {
              const q = search.trim().toLowerCase();
              if (!a.title.toLowerCase().includes(q) && !a.farmName.toLowerCase().includes(q)) return false;
            }
            return true;
          });
    const toggleSelect = (id: string) => {
            const next = new Set(selectedIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setSelectedIds(next);
          };
    const handleBulkAction = async (action: string) => {
            if (selectedIds.size === 0) return;
            try {
              await api.post("/mobile/alerts/bulk", {
                action,
                alertIds: Array.from(selectedIds)
              });
              reload();
              setSelectionMode(false);
              setSelectedIds(new Set());
            } catch (e) {
              alert("Erreur: " + messageFromError(e));
            }
          };
    return (
    <Screen style={{ backgroundColor: "#F7F3EE", flex: 1 }}>
      {selectionMode ? (
        <View style={{ backgroundColor: colors.brandPurple, paddingTop: 48, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Pressable onPress={() => { setSelectionMode(false); setSelectedIds(new Set()); }} style={{ width: 40, height: 40, justifyContent: "center" }}>
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </Pressable>
            <Text style={{ color: colors.white, fontSize: 20, fontWeight: "bold" }}>Alertes</Text>
            <View style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: "600" }}>{String(selectedIds.size).padStart(2, '0')} sélectionnées</Text>
            </View>
            <Pressable onPress={() => { setSelectionMode(false); setSelectedIds(new Set()); }} style={{ width: 40, height: 40, alignItems: "flex-end", justifyContent: "center" }}>
              <Ionicons name="close" size={24} color={colors.white} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <Pressable onPress={() => handleBulkAction("Non resolue")} style={{ alignItems: "center", gap: 4 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close-circle-outline" size={20} color={colors.white} />
              </View>
              <Text style={{ color: colors.white, fontSize: 10, fontWeight: "500" }}>Non résolue</Text>
            </Pressable>
            <Pressable onPress={() => handleBulkAction("En cours")} style={{ alignItems: "center", gap: 4 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="time-outline" size={20} color={colors.white} />
              </View>
              <Text style={{ color: colors.white, fontSize: 10, fontWeight: "500" }}>En cours</Text>
            </Pressable>
            <Pressable onPress={() => handleBulkAction("Resolue")} style={{ alignItems: "center", gap: 4 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
              </View>
              <Text style={{ color: colors.white, fontSize: 10, fontWeight: "500" }}>Résolue</Text>
            </Pressable>
            <Pressable onPress={() => handleBulkAction("Supprimer")} style={{ alignItems: "center", gap: 4 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="trash-outline" size={20} color={colors.white} />
              </View>
              <Text style={{ color: colors.white, fontSize: 10, fontWeight: "500" }}>Supprimer</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ paddingTop: 8, paddingHorizontal: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 8 }}>
            <Pressable onPress={() => onNavigate?.("goBack")} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="chevron-back" size={24} color={colors.brandPurple} />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandPurple, alignItems: "center", justifyContent: "center", ...softShadow }}>
                <Ionicons name="notifications" size={20} color={colors.white} />
                <View style={{ position: "absolute", top: 12, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger, borderWidth: 1, borderColor: colors.brandPurple }} />
              </View>
              <Pressable onPress={() => onNavigate?.("profile")} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", ...softShadow }}>
                <Ionicons name="person-outline" size={20} color={colors.brandPurple} />
              </Pressable>
            </View>
          </View>

          <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: 12, gap: 12, ...softShadow }}>
            <View style={{ flexDirection: "row", backgroundColor: "#F4F5FA", borderRadius: 24, padding: 4 }}>
              <Pressable
                onPress={() => setActiveTab("alertes")}
                style={{ flex: 1, height: 40, borderRadius: 20, backgroundColor: activeTab === "alertes" ? colors.brandPurple : "transparent", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: activeTab === "alertes" ? colors.white : colors.brandPurple, fontSize: 14, fontWeight: "700" }}>Alertes</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("notifications")}
                style={{ flex: 1, height: 40, borderRadius: 20, backgroundColor: activeTab === "notifications" ? colors.brandPurple : "transparent", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: activeTab === "notifications" ? colors.white : colors.brandPurple, fontSize: 14, fontWeight: "700" }}>Notifications</Text>
              </Pressable>
            </View>

            {activeTab === "alertes" && (
              <View style={{ flexDirection: "row", backgroundColor: "#F4F5FA", borderRadius: 24, padding: 4 }}>
                {["Tous", "Batterie", "Capteur", "Venin"].map(cat => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategoryFilter(cat)}
                    style={{ flex: 1, height: 32, borderRadius: 16, backgroundColor: categoryFilter === cat ? colors.brandPurple : "transparent", alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ color: categoryFilter === cat ? colors.white : colors.brandPurple, fontSize: 12, fontWeight: "600" }}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: 24, marginHorizontal: 8, marginTop: 8, marginBottom: 0 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, gap: 0, paddingBottom: 60 }}>
          {activeTab === "alertes" ? (
            <>
              {!selectionMode && (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16, marginTop: 8 }}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.ink400} />
                  <Text style={{ color: colors.ink400, fontSize: 14, fontWeight: "600" }}>Dernière alertes</Text>
                </View>
              )}
              {loading ? <Loading /> : null}
              {visibleAlerts.length === 0 && !loading ? <EmptyState text="Aucune alerte." /> : null}
              {visibleAlerts.map(alert => (
                <NotificationAlertRow 
                  key={alert.id} 
                  alert={alert} 
                  selectable={selectionMode}
                  selected={selectedIds.has(alert.id)}
                  onLongPress={() => {
                    if (!selectionMode) {
                      setSelectionMode(true);
                      toggleSelect(alert.id);
                    }
                  }}
                  onPress={() => {
                    if (selectionMode) {
                      toggleSelect(alert.id);
                    } else {
                      setSelectedAlert(alert);
                    }
                  }}
                />
              ))}
            </>
          ) : (
            notifLoading ? <Loading /> : !notifData?.items?.length ? <EmptyState text="Aucune notification." /> : (
              notifData.items.map(n => {
                let iconName: any = "notifications";
                let iconColor = colors.brandPurple;
                let bgColor = "#F4F5FA";
                if (n.type === "success") { iconName = "checkmark-circle"; iconColor = colors.success || "#10B981"; bgColor = "#ECFDF5"; }
                else if (n.type === "error") { iconName = "close-circle"; iconColor = colors.danger; bgColor = "#FEF2F2"; }
                else if (n.type === "warning") { iconName = "warning"; iconColor = "#F59E0B"; bgColor = "#FFFBEB"; }
                else if (n.type === "info") { iconName = "information-circle"; iconColor = "#3B82F6"; bgColor = "#EFF6FF"; }

                return (
                <View key={n._id} style={{ backgroundColor: colors.white, padding: 16, borderRadius: 20, marginBottom: 12, flexDirection: "row", gap: 14, ...softShadow }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bgColor, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={iconName} size={22} color={iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: colors.ink800, flex: 1, marginRight: 8 }}>{n.title}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.ink400 }}>
                        {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, lineHeight: 20, color: colors.ink500, fontWeight: "500" }}>{n.message}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 }}>
                      <Ionicons name="time-outline" size={12} color={colors.ink400} />
                      <Text style={{ fontSize: 11, color: colors.ink400, fontWeight: "600" }}>
                        {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>
                );
              })
            )
          )}
        </ScrollView>
      </View>
      
      <AlertDetailModal 
        visible={!!selectedAlert} 
        alert={selectedAlert} 
        farms={data?.farms || []}
        onClose={() => setSelectedAlert(null)} 
      />
    </Screen>
    );
}
