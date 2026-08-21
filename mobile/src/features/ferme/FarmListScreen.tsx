import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, Dimensions, Alert, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { api } from "src/services/api";
import { FermeAccordionCard } from "src/shared/components/FermeAccordionCard";
import { HomeTopBar } from "src/shared/components/HomeTopBar";
import { TunisiaMapCard } from "src/shared/components/TunisiaMapCard";
import { ErrorBanner, Loading, Screen } from "src/shared/components/ui";
import { colors, softShadow } from "src/shared/theme/theme";
import { MobileRucheDataPayload, ScreenKey, HomeAlertItem, MapStatusFilter } from "src/shared/types/types";
import { useEndpoint, buildLeafletHtml } from "src/shared/utils/helpers";

export function FarmListScreen({ onNavigate }: { onNavigate: (screen: ScreenKey, payload?: string) => void }) {
    const [selectedFarm, setSelectedFarm] = useState("Tous");
    const [mapOpen, setMapOpen] = useState(false);
    const [showAddFarmModal, setShowAddFarmModal] = useState(false);
    const [newFarmCity, setNewFarmCity] = useState("");
    const [newFarmSuburb, setNewFarmSuburb] = useState("");
    const [newFarmName, setNewFarmName] = useState("");
    const [newFarmLat, setNewFarmLat] = useState<number | null>(null);
    const [newFarmLng, setNewFarmLng] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [mapSearch, setMapSearch] = useState("");
    const [mapStatusFilter, setMapStatusFilter] = useState<MapStatusFilter>("Critique");
    const { data, loading, error, reload } = useEndpoint<MobileRucheDataPayload>("/mobile/ruche-data");
    const notifications = useEndpoint<{ items: any[]; unreadCount: number }>("/notifications?limit=5");
    const farms = data?.farms ?? [];
    const fermes = farms.map((f) => f.ferme);
    const alerts = data?.alerts ?? [];
    const stats = useMemo(() => {
            const ruches = fermes.reduce((sum, ferme) => sum + ferme.ruches, 0);
            const gateways = fermes.reduce((sum, ferme) => sum + ferme.gateway, 0);
            const attention = alerts.length;
            return { fermes: fermes.length, ruches, gateways, attention };
          }, [fermes, alerts]);
    const hasData = stats.fermes > 0;
    const harvestGrams = hasData ? Math.max(1, Math.round((stats.ruches * 120 + stats.gateways * 40) / 100)) : 0;
    const alertRows = useMemo<HomeAlertItem[]>(() => {
            return alerts.slice(0, 3).map((item) => ({
              id: item.id,
              title: item.title,
              location: item.farmName,
              date: item.date ?? "--",
              time: item.time ?? "--",
              status: item.status,
              tone: item.tone,
            }));
          }, [alerts]);
    const [listFilter, setListFilter] = useState<"Tous" | "Critique" | "Normale">("Tous");
    const [listSearch, setListSearch] = useState("");
    const filteredFermes = fermes.filter(f => {
            if (listFilter === "Critique" && f.ruchesAttention === 0) return false;
            if (listFilter === "Normale" && f.ruchesAttention > 0) return false;
            if (listSearch && !f.nom.toLowerCase().includes(listSearch.toLowerCase())) return false;
            return true;
          });

    const handleCreateFarm = async () => {
      if (!newFarmName.trim()) {
        Alert.alert("Erreur", "Veuillez entrer le nom de la ferme.");
        return;
      }
      setIsSubmitting(true);
      try {
        await api.post("/fermes", {
          name: newFarmName.trim(),
          lat: newFarmLat,
          lng: newFarmLng,
          address: `${newFarmSuburb}, ${newFarmCity}`.trim(),
          rucheCount: 0,
          gatewayCount: 1
        });
        setShowAddFarmModal(false);
        setNewFarmName("");
        setNewFarmCity("");
        setNewFarmSuburb("");
        setNewFarmLat(null);
        setNewFarmLng(null);
        Alert.alert("Succès", "La ferme a été ajoutée avec succès !");
        reload();
      } catch (err: any) {
        Alert.alert("Erreur", err?.response?.data?.error || "Erreur lors de la création de la ferme");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
    <View style={{ flex: 1 }}>
      <Screen scroll={false} style={styles.homeScreen}>
        <HomeTopBar
          onRefresh={reload}
          onNotifications={() => onNavigate("notifications")}
          onProfile={() => onNavigate("profile")}
          hasNotifications={stats.attention > 0 || (notifications.data?.unreadCount ?? 0) > 0}
        />
        {loading ? <Loading /> : null}
        {error ? <ErrorBanner message={error} /> : null}

        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Mini Map */}
          <View style={styles.miniMapContainer}>
            <TunisiaMapCard
              fermes={fermes}
              selectedFarm={"Tous"}
              onSelectFarm={() => {}}
              onOpen={() => setMapOpen(true)}
            />
          </View>

          {/* Alert Banner */}
          {stats.attention > 0 && (
            <Pressable style={styles.largeAlertBanner} onPress={() => onNavigate("notifications")}>
              <View style={styles.largeAlertIconBox}>
                <Ionicons name="warning-outline" size={20} color={colors.brandOrangeHover} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.largeAlertNumber}>{String(stats.attention).padStart(2, '0')} Ruches</Text>
                <Text style={styles.largeAlertSubtitle}>nécessitent de l'attention</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.white} />
            </Pressable>
          )}

          {/* Search Bar */}
          <View style={styles.farmListSearchBox}>
            <Ionicons name="search" size={18} color={colors.ink400} />
            <TextInput
              style={styles.farmListSearchInput}
              placeholder="Rechercher une ferme..."
              placeholderTextColor={colors.ink400}
              value={listSearch}
              onChangeText={setListSearch}
            />
          </View>

          {/* Filters */}
          <View style={styles.farmListFilterRow}>
            {(["Tous", "Critique", "Normale"] as const).map(filter => (
              <Pressable
                key={filter}
                style={[styles.farmFilterPill, listFilter === filter && styles.farmFilterPillActive]}
                onPress={() => setListFilter(filter)}
              >
                <Text style={[styles.farmFilterPillText, listFilter === filter && styles.farmFilterPillTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Accordion List */}
          <View style={styles.farmAccordionList}>
            {filteredFermes.map((f) => (
              <FermeAccordionCard key={f.id} ferme={f} onConsult={() => onNavigate("farm", f.id)} />
            ))}
          </View>
        </ScrollView>
      </Screen>

      {/* Floating Action Button - outside Screen so it stays fixed */}
      <Pressable style={styles.fab} onPress={() => setShowAddFarmModal(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {/* Add Farm Modal */}
      <Modal visible={showAddFarmModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }} />
              <Pressable style={styles.modalCloseButton} onPress={() => setShowAddFarmModal(false)}>
                <Ionicons name="close" size={24} color={colors.ink500} />
              </Pressable>
            </View>
            <Text style={styles.modalTitle}>Associer à une ferme</Text>

            {/* Map Area */}
            <View style={styles.mapSimulationContainer}>
              <WebView
                source={{ html: `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { width: 100vw; height: 100vh; background: #e2e8f0; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', { zoomControl: false }).setView([36.8065, 10.1815], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: ''
        }).addTo(map);

        var currentMarker = null;

        map.on('click', function(e) {
            var lat = e.latlng.lat;
            var lng = e.latlng.lng;
            
            if(currentMarker) {
                map.removeLayer(currentMarker);
            }
            
            var customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: "<div style='background-color:#f28c28;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(242,140,40,0.8);'></div>",
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });
            
            currentMarker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
            
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
            }
        });
    </script>
</body>
</html>
                ` }}
                style={{ flex: 1 }}
                onMessage={async (event) => {
                  try {
                    const coords = JSON.parse(event.nativeEvent.data);
                    if (coords.lat && coords.lng) {
                      setIsGeocoding(true);
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`, {
                        headers: {
                          "User-Agent": "NectalousApp/1.0",
                          "Accept-Language": "fr"
                        }
                      });
                      if (!res.ok) throw new Error("API error");
                      const data = await res.json();
                      if (data && data.address) {
                        const addr = data.address;
                        const city = addr.city || addr.town || addr.county || addr.state || "Ville inconnue";
                        const suburb = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || addr.state_district || data.name || "Non spécifié";
                        setNewFarmCity(city.replace(/Gouvernorat (de )?/i, "").trim());
                        setNewFarmSuburb(suburb.replace(/Délégation /i, "").trim());
                        setNewFarmLat(coords.lat);
                        setNewFarmLng(coords.lng);
                      }
                    }
                  } catch (e) {
                    console.log("Geocoding error", e);
                  } finally {
                    setIsGeocoding(false);
                  }
                }}
              />
              <View style={styles.mapExpandIcon} pointerEvents="none">
                <Ionicons name="expand-outline" size={16} color={colors.brandPurple} />
              </View>
              {isGeocoding && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator size="large" color={colors.brandPurple} />
                </View>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.modalForm}>
              <View style={styles.fakeDropdown}>
                <Text style={[styles.fakeDropdownText, !newFarmCity && { color: colors.ink400 }]}>
                  {newFarmCity || "Sélectionner un pays/ville"}
                </Text>
                <Ionicons name="caret-down" size={14} color={colors.ink800} />
              </View>
              
              <View style={styles.fakeDropdown}>
                <Text style={[styles.fakeDropdownText, !newFarmSuburb && { color: colors.ink400 }]}>
                  {newFarmSuburb || "Sélectionner une région"}
                </Text>
                <Ionicons name="caret-down" size={14} color={colors.ink800} />
              </View>

              <TextInput 
                style={styles.modalInput}
                placeholder="Nom de votre ferme"
                value={newFarmName}
                onChangeText={setNewFarmName}
                placeholderTextColor={colors.ink400}
              />
            </View>

            <Pressable style={styles.modalConfirmBtn} onPress={handleCreateFarm} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.modalConfirmBtnText}>Confirmer</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
    );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 30,
    bottom: 110,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandPurple,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brandPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 999,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#F4F5F7",
    borderRadius: 24,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D1B4E",
    marginBottom: 20,
    marginTop: 4,
  },
  mapSimulationContainer: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    marginBottom: 20,
    position: "relative",
  },
  mapExpandIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalForm: {
    gap: 12,
    marginBottom: 32,
  },
  fakeDropdown: {
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  fakeDropdownText: {
    fontSize: 16,
    color: "#565D6D",
    fontWeight: "500",
  },
  modalInput: {
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#565D6D",
    fontWeight: "500",
  },
  modalConfirmBtn: {
    height: 56,
    backgroundColor: "#7D8CDB",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  homeScreen: {
    paddingTop: 40,
    gap: 12,
  },
  miniMapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: -8,
  },
  largeAlertBanner: {
    backgroundColor: colors.brandOrangeHover,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...softShadow,
  },
  largeAlertIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  largeAlertNumber: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  largeAlertSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  farmListSearchBox: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    ...softShadow,
  },
  farmListSearchInput: {
    flex: 1,
    height: 48,
    color: colors.ink800,
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
  },
  farmListFilterRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.primary100,
    borderRadius: 24,
    padding: 4,
  },
  farmFilterPill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  farmFilterPillActive: {
    backgroundColor: "#808EE7",
  },
  farmFilterPillText: {
    color: "#808EE7",
    fontSize: 13,
    fontWeight: "700",
  },
  farmFilterPillTextActive: {
    color: colors.white,
  },
  farmAccordionList: {
    gap: 12,
  },
});