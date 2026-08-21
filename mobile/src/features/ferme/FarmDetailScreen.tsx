import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FarmBatteryTab } from "src/shared/components/FarmBatteryTab";
import { FarmCollectorBanner } from "src/shared/components/FarmCollectorBanner";
import { FarmConfirmModal } from "src/shared/components/FarmConfirmModal";
import { FarmPlanTab } from "src/shared/components/FarmPlanTab";
import { FarmRuchesTab } from "src/shared/components/FarmRuchesTab";
import { FarmSectionTabs } from "src/shared/components/FarmSectionTabs";
import { FarmSelector } from "src/shared/components/FarmSelector";
import { FarmVeninTab } from "src/shared/components/FarmVeninTab";
import { FarmWeatherCard } from "src/shared/components/FarmWeatherCard";
import { FarmWeatherModal } from "src/shared/components/FarmWeatherModal";
import { HomeTopBar } from "src/shared/components/HomeTopBar";
import { MapExplorerView } from "src/shared/components/MapExplorerView";
import { ErrorBanner, Loading, Screen } from "src/shared/components/ui";
import { MobileRucheDataPayload, ScreenKey, FarmDetailTab, FarmRucheFilter, MapStatusFilter } from "src/shared/types/types";
import { TIME_FILTERS } from "src/shared/utils/constants";
import { useEndpoint } from "src/shared/utils/helpers";

export function FarmDetailScreen({ onNavigate, onSelectHive, initialFarmId }: { onNavigate: (screen: ScreenKey, payload?: string) => void; onSelectHive?: (id: string) => void; initialFarmId?: string | null }) {
    const [selectedFarmId, setSelectedFarmId] = useState(initialFarmId ?? "");
    const [activeTimeFilter, setActiveTimeFilter] = useState<(typeof TIME_FILTERS)[number]>("1M");
    const { data, loading, error, reload } = useEndpoint<MobileRucheDataPayload>(`/mobile/ruche-data?filter=${activeTimeFilter}`, [activeTimeFilter], 5000);
    const farmData = data?.farms ?? [];
    const fermes = farmData.map((item) => item.ferme);
    const [activeTab, setActiveTab] = useState<FarmDetailTab>("Ruches");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FarmRucheFilter>("Tous");
    const [showWeather, setShowWeather] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [confirmMode, setConfirmMode] = useState<"start" | "delete" | null>(null);
    const [mapSearch, setMapSearch] = useState("");
    const [mapStatusFilter, setMapStatusFilter] = useState<MapStatusFilter>("Tous");
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
      if (initialFarmId) {
        setSelectedFarmId(initialFarmId);
      } else if (fermes.length > 0 && !selectedFarmId) {
        setSelectedFarmId(fermes[0].id);
      }
    }, [initialFarmId, fermes.length]);

    const selectedFarmData = farmData.find((item) => item.ferme.id === selectedFarmId) ?? farmData[0];
    const selectedFarm = selectedFarmData?.ferme ?? fermes[0];
    const hives = selectedFarmData?.hives ?? [];

    const filteredHives = useMemo(() => {
            const query = search.trim().toLowerCase();
            return hives.filter((hive) => {
              const matchesSearch = !query || hive.name.toLowerCase().includes(query);
              if (!matchesSearch) return false;
              if (filter === "Critique") return hive.isCritical;
              if (filter === "Normal") return !hive.isCritical;
              return true;
            });
          }, [filter, hives, search]);

    if (showMap) {
    return (
      <MapExplorerView
        fermes={fermes}
        loading={loading}
        error={error}
        search={mapSearch}
        onSearch={setMapSearch}
        statusFilter={mapStatusFilter}
        onStatusFilter={setMapStatusFilter}
        onBack={() => setShowMap(false)}
        onNotifications={() => onNavigate("notifications")}
        onProfile={() => onNavigate("profile")}
        onSelectFarm={(id) => {
          setSelectedFarmId(id);
          onNavigate("farm", id);
          setShowMap(false);
        }}
      />
    );
    }

    return (
    <View style={{ flex: 1 }}>
      <Screen style={styles.farmScreen}>
        <HomeTopBar
          onBack={() => onNavigate("goBack")}
          onNotifications={() => onNavigate("notifications")}
          onProfile={() => onNavigate("profile")}
          hasNotifications={hives.some((hive) => hive.isCritical)}
        />
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        <FarmSelector
          fermes={fermes}
          selectedFarm={selectedFarm}
          onSelect={(id) => {
            setSelectedFarmId(id);
            onNavigate("farm", id);
          }}
          onOpenMap={() => setShowMap(true)}
        />
        <FarmWeatherCard farm={selectedFarm} weather={selectedFarmData?.weather} onDetails={() => setShowWeather(true)} />
        <FarmCollectorBanner active={selectedFarmData?.collecteursActifs ?? null} />
        <FarmSectionTabs active={activeTab} onChange={setActiveTab} />
        {activeTab === "Ruches" ? (
          <FarmRuchesTab
            search={search}
            onSearch={setSearch}
            filter={filter}
            onFilter={setFilter}
            hives={filteredHives}
            onAdd={() => onNavigate("gateway")}
            onSelectHive={onSelectHive}
          />
        ) : null}
        {activeTab === "Batterie" ? <FarmBatteryTab hives={hives} farmData={selectedFarmData} alerts={data?.alerts ?? []} timeFilter={activeTimeFilter} onTimeFilterChange={(f) => setActiveTimeFilter(f as any)} /> : null}
        {activeTab === "Venin" ? <FarmVeninTab hives={hives} farmData={selectedFarmData} alerts={data?.alerts ?? []} timeFilter={activeTimeFilter} onTimeFilterChange={(f) => setActiveTimeFilter(f as any)} /> : null}
        {activeTab === "Plan" ? (
          <FarmPlanTab farmId={selectedFarm?.id ?? ""} hives={hives} onStart={() => setConfirmMode("start")} onDelete={() => setConfirmMode("delete")} />
        ) : null}
        <FarmWeatherModal visible={showWeather} onClose={() => setShowWeather(false)} farm={selectedFarm} weather={selectedFarmData?.weather} />
        <FarmConfirmModal mode={confirmMode} onClose={() => setConfirmMode(null)} />
      </Screen>
    </View>
    );
}

const styles = StyleSheet.create({
  farmScreen: { paddingTop: 32, gap: 12 },
});
