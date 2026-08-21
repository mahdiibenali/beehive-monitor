export type ScreenKey = "dashboard" | "fermes" | "farmList" | "farm" | "fermeDashboard" | "hive" | "gateway" | "maintenance" | "notifications" | "profile" | "editProfile" | "goBack";

export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: any;
}


export interface FermeListItem {
  id: string;
  nom: string;
  region: string;
  // add other fields based on usage
  [key: string]: any;
}

export interface MobileAlertItem {
  id: string;
  title: string;
  message: string;
  severity: string;
  createdAt: string;
  [key: string]: any;
}

export interface MobileFarmData {
  id: string;
  name: string;
  [key: string]: any;
}

export interface MobileHiveItem {
  id: string;
  name: string;
  [key: string]: any;
}

export interface MobileRucheDataPayload {
  data: any;
  [key: string]: any;
}

export interface MobileSeries {
  labels: string[];
  values: number[];
  [key: string]: any;
}

export interface MobileWeather {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  [key: string]: any;
}

export interface PaginatedPayload<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  [key: string]: any;
}

// --- CONSOLIDATED TYPES ---
export type AlertStatusFilter = "Tous" | "Resolue" | "En cours" | "Non resolue";
export type AlertViewMode = "overview" | "detail" | "all";
export type FarmDetailTab = "Ruches" | "Batterie" | "Venin" | "Plan";
export type FarmHiveItem = MobileHiveItem;
export interface FarmMapMarker {
    id: string;
    title: string;
    subtitle: string;
    latitude: number;
    longitude: number;
    isAlert: boolean;
}
export type FarmRucheFilter = "Tous" | "Critique" | "Normal";
export type HiveAlertItem = MobileAlertItem;
export interface HomeAlertItem {
    id: string;
    title: string;
    location: string;
    date: string;
    time: string;
    status: string;
    tone: "orange" | "red" | "purple";
}
export type MapStatusFilter = "Tous" | "Critique" | "Normale";
export interface VenomHiveItem {
    id: string;
    name: string;
    farm: string;
    isActive: boolean;
    isAlert: boolean;
    collected: string;
    plaque: string;
    lastDate: string;
}

