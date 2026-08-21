/** Shared types for the apiculteur "Mes ruches" feature (client + server). */

export type RucheStatus = "alerte" | "normale";

export interface RucheListItem {
  id: string;
  name: string;
  serial: string;
  status: RucheStatus;
  alerts: number;
  gatewayIndex: number;
  gatewayLabel: string;
  lat: number | null;
  lng: number | null;

  /** Parent ferme info (denormalised for the list view). */
  fermeId: string;
  fermeName: string;
  region: string;
  pays: string;
  localisation: string;
}

export interface RucheListPayload {
  items: RucheListItem[];
  total: number;
  totalAll: number;
  totalAttention: number;
  page: number;
  pageSize: number;
  apiculteurId: string;
}
