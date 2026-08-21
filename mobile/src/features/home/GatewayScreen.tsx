import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, Modal, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { api } from "src/services/api";
import { Badge, Button, Card, ErrorBanner, H2, Header, Input, Loading, Muted, Screen } from "src/shared/components/ui";
import { colors, softShadow } from "src/shared/theme/theme";
import { FermeListItem, PaginatedPayload, ScreenKey } from "src/shared/types/types";
import { messageFromError, useEndpoint } from "src/shared/utils/helpers";
import { TunisiaMapCard } from "src/shared/components/TunisiaMapCard";

export function GatewayScreen({ onNavigate }: { onNavigate?: (screen: ScreenKey) => void }) {
    const [permission, requestPermission] = useCameraPermissions();
    
    // Steps: "farm" -> "method" -> "scan" | "manual"
    const [step, setStep] = useState<"farm" | "method" | "scan" | "manual">("farm");
    const [selectedMethod, setSelectedMethod] = useState<"scan" | "manual">("scan");
    const [searchQuery, setSearchQuery] = useState("");
    
    const [fermeId, setFermeId] = useState("");
    const [serial, setSerial] = useState("");
    const [saving, setSaving] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const { data, loading, error, reload } = useEndpoint<PaginatedPayload<FermeListItem>>("/fermes?page=1&pageSize=100");
    const fermes = data?.items ?? [];
    
    useEffect(() => {
        if (!fermeId && fermes[0]) setFermeId(fermes[0].id);
    }, [fermes, fermeId]);

    const filteredFermes = fermes.filter((f: FermeListItem) => f.nom.toLowerCase().includes(searchQuery.toLowerCase()));

    function handleCode(data: string) {
        setScanned(true);
        let extractedSerial = data;
        let payload = null;
        try {
          const parsed = JSON.parse(data);
          payload = parsed;
          extractedSerial = parsed.gateway_id ?? parsed.end_device_data?.device_id ?? parsed.serialNumber ?? data;
        } catch {
          payload = null;
        }
        
        const isValid = /^[A-Za-z]{2}_[A-Za-z]+_\d{2,3}$/.test(extractedSerial);
        if (!isValid) {
            Alert.alert("Code Invalide", "Le code QR n'est pas reconnu. Format attendu: XX_XXXXXX_000", [
                { text: "OK", onPress: () => setScanned(false) }
            ]);
            return;
        }
        
        setSerial(extractedSerial);
        // Go back to the manual step so the modal slides up with the scanned ID!
        setStep("manual");
    }

    async function pair(pairSerial: string, pairPayload: Record<string, unknown> | null) {
        const isValid = /^[A-Za-z]{2}_[A-Za-z]+_\d{2,3}$/.test(pairSerial.trim());
        if (!isValid) {
            Alert.alert("Code Invalide", "Le code Gateway saisi n'est pas valide. Format attendu: XX_XXXXXX_000");
            return;
        }

        setSaving(true);
        setErrorMsg(null);
        setNotice(null);
        try {
          const response = await api.post("/gateways", {
            fermeId,
            serialNumber: pairSerial.trim(),
            source: pairPayload ? "qr" : "manual",
            payload: pairPayload
          });
          setNotice(`Gateway ${response.data.gateway.serialNumber} associée avec succès.`);
          setTimeout(() => {
              if (onNavigate) onNavigate("goBack");
          }, 2500);
        } catch (err) {
          setErrorMsg(messageFromError(err));
          // Stay on manual input on error
        } finally {
          setSaving(false);
        }
    }

    const handleClose = () => {
      if (onNavigate) onNavigate("goBack");
    };

    const renderFarmContent = () => (
      <>
        <View style={styles.modalHeaderRow}>
          <Text style={styles.modalTitleLeft}>Sélectionner une ferme</Text>
          <Pressable onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.ink400} />
          </Pressable>
        </View>
        <Text style={styles.modalSubtitleLeft}>Choisissez la ferme dans laquelle vous souhaitez ajouter la gateway.</Text>
        
        {fermes.length > 0 && (
          <View style={styles.mapContainer}>
            <TunisiaMapCard fermes={fermes} selectedFarm={fermeId} onSelectFarm={setFermeId} onOpen={() => {}} />
          </View>
        )}

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.ink400} />
          <TextInput 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            placeholder="Rechercher une ferme..." 
            placeholderTextColor={colors.ink400} 
            style={styles.searchInput} 
          />
        </View>

        <ScrollView style={styles.farmList} showsVerticalScrollIndicator={false}>
          {loading && <Loading />}
          {filteredFermes.map((ferme: FermeListItem) => {
            const isActive = fermeId === ferme.id;
            return (
              <Pressable 
                key={ferme.id} 
                style={[styles.farmListItem, isActive && styles.farmListItemActive]} 
                onPress={() => setFermeId(ferme.id)}
              >
                <Text style={[styles.farmListTitle, isActive && styles.farmListTitleActive]}>{ferme.nom}</Text>
                {isActive && <Ionicons name="checkmark" size={20} color={colors.white} />}
              </Pressable>
            );
          })}
          {filteredFermes.length === 0 && !loading && (
            <Muted style={{textAlign: "center", marginTop: 20}}>Aucune ferme trouvée.</Muted>
          )}
        </ScrollView>

        <View style={{marginTop: 16}}>
          <Button onPress={() => setStep("method")} disabled={!fermeId}>
            Choisir une ferme
          </Button>
        </View>
      </>
    );

    const renderMethodContent = () => (
      <>
        <View style={styles.dragHandle} />
        <View style={styles.methodIconWrapper}>
          <View style={styles.methodIconBadge}>
            <Ionicons name="document-text-outline" size={20} color={colors.brandOrange} />
          </View>
        </View>
        <Text style={styles.modalTitleCentered}>Connecter votre ruche au collecteur</Text>
        <Text style={styles.modalSubtitleCentered}>Choisissez la méthode puis sélectionnez une ferme ou une gateway existante</Text>
        
        <View style={styles.methodCardsContainer}>
          <Pressable 
            style={[styles.methodCard, selectedMethod === "scan" && styles.methodCardActive]} 
            onPress={() => setSelectedMethod("scan")}
          >
            <View style={styles.methodCardIconBox}>
              <Ionicons name="qr-code-outline" size={24} color={colors.brandPurple} />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.methodCardTitle, selectedMethod === "scan" && styles.methodCardTitleActive]}>Scanner le QR code</Text>
              <Text style={styles.methodCardSubtitle}>Scan rapide du code sur la ruche</Text>
            </View>
            <Ionicons 
              name={selectedMethod === "scan" ? "radio-button-on" : "radio-button-off"} 
              size={24} 
              color={selectedMethod === "scan" ? colors.brandPurple : colors.ink100} 
            />
          </Pressable>

          <Pressable 
            style={[styles.methodCard, selectedMethod === "manual" && styles.methodCardActive]} 
            onPress={() => setSelectedMethod("manual")}
          >
            <View style={styles.methodCardIconBox}>
              <Ionicons name="keypad-outline" size={24} color={colors.brandPurple} />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.methodCardTitle, selectedMethod === "manual" && styles.methodCardTitleActive]}>Insérer le code</Text>
              <Text style={styles.methodCardSubtitle}>Gateway manuellement</Text>
            </View>
            <Ionicons 
              name={selectedMethod === "manual" ? "radio-button-on" : "radio-button-off"} 
              size={24} 
              color={selectedMethod === "manual" ? colors.brandPurple : colors.ink100} 
            />
          </Pressable>
        </View>

        <View style={{marginTop: 16}}>
          <Button 
            onPress={async () => {
              if (selectedMethod === "scan" && !permission?.granted) {
                await requestPermission();
              }
              setStep(selectedMethod);
            }} 
          >
            Continuer
          </Button>
        </View>
      </>
    );

    const renderManualContent = () => (
      <>
        <View style={styles.dragHandle} />
        
        <Text style={styles.modalTitleCentered}>Ajout de Gateway</Text>
        
        <View style={styles.manualInputBox}>
          <TextInput 
            style={styles.manualInputText}
            placeholder="00"
            placeholderTextColor={colors.ink400}
            value={serial}
            onChangeText={setSerial}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {errorMsg ? (
          <View style={{marginTop: 16}}>
            <ErrorBanner message={errorMsg} />
          </View>
        ) : null}

        <View style={{marginTop: 24}}>
          <Button 
            disabled={!serial.trim()}
            onPress={() => pair(serial, null)} 
          >
            Confirmer
          </Button>
        </View>
      </>
    );

    // Single unified modal for the bottom sheet steps and loading/success states
    const renderBottomSheetModal = () => {
      const isVisible = ["farm", "method", "manual"].includes(step) || saving || notice !== null;
      
      return (
        <Modal visible={isVisible} transparent animationType="slide" onRequestClose={handleClose}>
          <Pressable style={styles.modalBackdrop} onPress={handleClose}>
            <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
               {saving || notice !== null ? (
                 <View style={{ alignItems: "center", paddingVertical: 40 }}>
                   {saving && (
                     <View style={styles.loadingWrapper}>
                        <Text style={styles.loadingTitle}>{serial || "Gateway"}</Text>
                        <Text style={styles.loadingSubtitle}>Connexion au capteur en cours...</Text>
                        
                        <View style={styles.spinnerRing}>
                           <ActivityIndicator size="large" color={colors.brandPurple} style={{ position: "absolute" }} />
                           <Ionicons name="layers-outline" size={40} color={colors.brandPurple} />
                        </View>

                        <Text style={styles.loadingFooter}>Veuillez patienter...</Text>
                     </View>
                   )}
                   
                   {notice && !saving && (
                     <View style={styles.successWrapper}>
                        <View style={styles.successIconBox}>
                          <Ionicons name="checkmark" size={40} color={colors.white} />
                        </View>
                        <Text style={styles.successTitle}>Succès !</Text>
                        <Text style={styles.successSubtitle}>{notice}</Text>
                     </View>
                   )}
                 </View>
               ) : (
                 <>
                   {step === "farm" && renderFarmContent()}
                   {step === "method" && renderMethodContent()}
                   {step === "manual" && renderManualContent()}
                 </>
               )}
            </Pressable>
          </Pressable>
        </Modal>
      );
    };

    return (
    <View style={{flex: 1, backgroundColor: colors.ink50}}>
      {renderBottomSheetModal()}

      {/* Main Screen Background (Only visible if step === "scan", otherwise it's just a dark background) */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 }}>
          {step === "scan" && (
            <>
              <View style={styles.headerWrapper}>
                <Header title="Associer Gateway" subtitle="Scannez le QR code" action={
                  <Pressable onPress={() => setStep("method")}><Muted>Retour</Muted></Pressable>
                } />
              </View>
              
              <View style={styles.cameraBox}>
                {permission?.granted ? (
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13"] }}
                    onBarcodeScanned={scanned ? undefined : ({ data }) => handleCode(data)}
                  />
                ) : (
                  <View style={styles.cameraFallback}>
                    <Ionicons name="camera-outline" size={42} color={colors.ink400} />
                    <Muted style={{ textAlign: "center" }}>Permission camera requise.</Muted>
                    <Button onPress={requestPermission}>Autoriser</Button>
                  </View>
                )}
                <View style={styles.scanFrame} />
              </View>
            </>
          )}
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  headerWrapper: {
    paddingHorizontal: 0,
    paddingTop: 16
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
    ...softShadow
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  modalTitleLeft: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink900
  },
  modalSubtitleLeft: {
    fontSize: 13,
    color: colors.ink400,
    marginBottom: 20
  },
  mapContainer: {
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    ...softShadow
  },
  searchBox: { 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: colors.white, 
    borderWidth: 1,
    borderColor: colors.ink200,
    paddingHorizontal: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    marginBottom: 16
  },
  searchInput: { 
    flex: 1, 
    height: 48, 
    color: colors.ink700, 
    fontSize: 14, 
    fontWeight: "600", 
    padding: 0 
  },
  farmList: {
    maxHeight: 250,
  },
  farmListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent"
  },
  farmListItemActive: {
    backgroundColor: colors.brandPurple,
  },
  farmListTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink700
  },
  farmListTitleActive: {
    color: colors.white,
    fontWeight: "800"
  },
  
  // Method Picker Styles
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.ink200,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20
  },
  methodIconWrapper: {
    alignItems: "center",
    marginBottom: 16
  },
  methodIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accent100,
    alignItems: "center",
    justifyContent: "center"
  },
  modalTitleCentered: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink900,
    textAlign: "center",
    marginBottom: 8
  },
  modalSubtitleCentered: {
    fontSize: 13,
    color: colors.ink400,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 10
  },
  methodCardsContainer: {
    gap: 12,
    marginBottom: 24
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.ink50,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 16
  },
  methodCardActive: {
    backgroundColor: colors.primary100,
    borderColor: colors.brandPurple,
  },
  methodCardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary100,
    alignItems: "center",
    justifyContent: "center"
  },
  methodCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink700,
    marginBottom: 2
  },
  methodCardTitleActive: {
    color: colors.brandPurple,
    fontWeight: "800"
  },
  methodCardSubtitle: {
    fontSize: 12,
    color: colors.ink400
  },

  // Manual Input Screen Styles (Image 2)
  manualInputBox: {
    backgroundColor: colors.ink50,
    borderRadius: 20,
    height: 120,
    marginTop: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.ink200
  },
  manualInputText: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.brandPurple,
    textAlign: "center",
    width: "100%"
  },

  // Loading/Pairing Styles (Image 1)
  loadingWrapper: {
    alignItems: "center",
    width: "100%"
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink900,
    marginBottom: 8
  },
  loadingSubtitle: {
    fontSize: 14,
    color: colors.ink500,
    marginBottom: 40
  },
  spinnerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: colors.primary100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40
  },
  loadingFooter: {
    fontSize: 14,
    color: colors.ink400
  },

  // Success Message Styles
  successWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...softShadow
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink900,
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.ink500,
    textAlign: "center"
  },

  // Camera styles
  cameraBox: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.ink900,
    marginTop: 20,
    marginBottom: 40
  },
  cameraFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: colors.ink100
  },
  scanFrame: {
    position: "absolute",
    top: "30%",
    left: "15%",
    right: "15%",
    height: "40%",
    borderWidth: 3,
    borderColor: colors.brandOrange,
    borderRadius: 28
  }
});
