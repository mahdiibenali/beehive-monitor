import { Ionicons } from "@expo/vector-icons";
import { ScreenKey } from "../types/types";
import { SvgProps } from "react-native-svg";
import { ComponentType } from "react";
import { DashIcon } from "src/shared/components/icons/DashIcon";

export const screenLabels: Record<ScreenKey, {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  SvgIcon?: ComponentType<SvgProps>;
}> = {
  dashboard: { label: "Venin", icon: "water-outline" },
  fermes:    { label: "Home",  icon: "grid-outline" },
farmList:       { label: "Ferme", SvgIcon: DashIcon },
farm:           { label: "Ferme", SvgIcon: DashIcon },
  fermeDashboard: { label: "Détails ferme", SvgIcon: undefined },
  hive:          { label: "Ruche",   icon: "cube-outline" },
  gateway:       { label: "Gateway", icon: "qr-code-outline" },
  maintenance:   { label: "Alertes", icon: "file-tray-stacked-outline" },
  notifications: { label: "Notif",   icon: "notifications-outline" },
  profile:       { label: "Profil",  icon: "person-outline" },
  goBack:        { label: "Retour",  icon: "arrow-back-outline" },
};