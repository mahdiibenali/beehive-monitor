/** Shared types for the apiculteur "Fermes" feature (client + server). */

export type FermeStatus = "alerte" | "normale";

export interface FermeListItem {
  id: string;
  nom: string;
  pays: string;
  region: string;
  gateway: number;
  ruches: number;
  ruchesAttention: number;
  status: FermeStatus;
  address: string;
  plusCode: string;
  lat: number | null;
  lng: number | null;
}

export interface FermeListPayload {
  items: FermeListItem[];
  total: number;
  totalAll: number;
  totalAttention: number;
  page: number;
  pageSize: number;
  apiculteurId: string;
}
