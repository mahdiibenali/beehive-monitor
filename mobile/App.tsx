import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View
} from "react-native";
import { AuthProvider, useAuth } from "src/core/providers/AuthContext";
import { MaintenanceScreen } from "src/features/alerts/MaintenanceScreen";
import { NotificationsScreen } from "src/features/alerts/NotificationsScreen";
import { LoginScreen } from "src/features/auth/LoginScreen";
import { FarmDetailScreen } from "src/features/ferme/FarmDetailScreen";
import { FarmListScreen } from "src/features/ferme/FarmListScreen";
import { FermeDashboardScreen } from "src/features/ferme/FermeDashboardScreen";
import { FermesScreen } from "src/features/ferme/FermesScreen";
import { HiveDetailScreen } from "src/features/hive/HiveDetailScreen";
import { HivesScreen } from "src/features/hive/HivesScreen";
import { DashboardScreen } from "src/features/home/DashboardScreen";
import { GatewayScreen } from "src/features/home/GatewayScreen";
import { ProfileScreen } from "src/features/profile/ProfileScreen";
import { EditProfileScreen } from "src/features/profile/EditProfileScreen";
import { mobileScreens } from "src/shared/utils/mobileScreens";
import { screenLabels } from "src/shared/utils/screenLabels";
import { colors, radius, shadow } from "src/shared/theme/theme";
import { ScreenKey } from "src/shared/types/types";

type NavState = {
  screen: ScreenKey;
  selectedHiveId: string | null;
  selectedFarmId: string | null;
};

function Shell() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [history, setHistory] = useState<NavState[]>([]);
  const [selectedHiveId, setSelectedHiveId] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const navItems = useMemo(() => (user ? mobileScreens : []), [user]);
  const available = useMemo<ScreenKey[]>(
    () => (user ? [...mobileScreens, "gateway", "notifications", "profile", "editProfile", "farm", "fermeDashboard", "hive"] : []),
    [user]
  );

  useEffect(() => {
    if (user && !available.includes(screen)) {
      setScreen("dashboard");
      setHistory([]);
    }
  }, [available, screen, user]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brandPurple} />
      </View>
    );
  }

  if (!user) return <LoginScreen />;

  const handleNavigate = (next: ScreenKey, payload?: string) => {
    if (next === "goBack") {
      if (history.length > 0) {
        const prev = history[history.length - 1];
        setHistory((h) => h.slice(0, -1));
        setScreen(prev.screen);
        setSelectedHiveId(prev.selectedHiveId);
        setSelectedFarmId(prev.selectedFarmId);
      } else {
        setScreen("dashboard");
      }
      return;
    }
    
    const currentNavState: NavState = { screen, selectedHiveId, selectedFarmId };

    let isNewState = next !== screen;
    if (next === "hive" && payload !== selectedHiveId) isNewState = true;
    if ((next === "farm" || next === "fermeDashboard") && payload !== selectedFarmId) isNewState = true;

    if (isNewState) {
      setHistory((h) => [...h, currentNavState]);
    }

    if (next === "hive") {
      if (payload) {
        setSelectedHiveId(payload);
      } else {
        setSelectedHiveId(null);
      }
    }
    
    if (next === "farm" && payload) {
      setSelectedFarmId(payload);
    }
    if (next === "fermeDashboard" && payload) {
      setSelectedFarmId(payload);
    }
    setScreen(next);
  };

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.content}>{renderScreen(screen, handleNavigate, selectedHiveId, selectedFarmId)}</View>
      {!(screen === "hive" && selectedHiveId) && !(screen === "fermeDashboard" && selectedFarmId) && !(screen === "fermeDashboard") && screen !== "profile" && screen !== "editProfile" && (
        <BottomNav
          active={screen}
          items={navItems}
          onPress={(next) => handleNavigate(next)}
        />
      )}
    </View>
  );
}

export function renderScreen(screen: ScreenKey, setScreen: (screen: ScreenKey, payload?: string) => void, selectedHiveId: string | null, selectedFarmId?: string | null) {
  switch (screen) {
    case "dashboard":
      return <DashboardScreen onNavigate={setScreen} />;
    case "fermes":
      return <FermesScreen onNavigate={setScreen} />;
    case "farmList":
      return <FarmListScreen onNavigate={setScreen} />;
    case "farm":
      return <FarmDetailScreen onNavigate={setScreen} initialFarmId={selectedFarmId} onSelectHive={(id) => setScreen("hive", id)} />;
    case "fermeDashboard":
      return <FermeDashboardScreen onNavigate={setScreen} initialFarmId={selectedFarmId} />;
    case "hive":
      if (selectedHiveId) {
        return <HiveDetailScreen onNavigate={setScreen} selectedHiveId={selectedHiveId} />;
      }
      return <HivesScreen onNavigate={setScreen} />;
    case "gateway":
      return <GatewayScreen onNavigate={setScreen} />;
    case "maintenance":
      return <MaintenanceScreen onNavigate={setScreen} />;
    case "notifications":
      return <NotificationsScreen onNavigate={setScreen} />;
    case "profile":
      return <ProfileScreen onNavigate={setScreen} />;
    case "editProfile":
      return <EditProfileScreen onNavigate={setScreen} />;
    default:
      return <DashboardScreen onNavigate={setScreen} />;
  }
}

function BottomNav({
  active,
  items,
  onPress
}: {
  active: ScreenKey;
  items: ScreenKey[];
  onPress: (screen: ScreenKey) => void;
}) {
  return (
    <View style={styles.navOuter}>
      <View style={styles.navInner}>
        {items.map((item) => {
          const isActive = active === item;
          const meta = screenLabels[item];
          const iconColor = isActive ? colors.white : colors.ink400;
          return (
            <Pressable
              key={item}
              onPress={() => onPress(item)}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              {meta.SvgIcon ? (
  <meta.SvgIcon width={50} height={50} color={iconColor} />
              ) : (
  <Ionicons name={meta.icon!} size={24} color={iconColor} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.ink50
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink50
  },
  content: {
    flex: 1
  },
  navOuter: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    height: 72,
    borderRadius: radius.navbar,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    justifyContent: "center",
    ...shadow
  },
  navInner: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around"
  },
  navItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2
  },
  navItemActive: {
    backgroundColor: colors.brandPurple,
    ...shadow
  }
});
