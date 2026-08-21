/** A single ruche row aggregated across all of the apiculteur's fermes. */
export interface RucheRow {
  id: string;
  name: string;
  fermeId: string;
  fermeName: string;
  region: string;
  pays: string;
  localisation: string;
  gatewayLabel: string;
  gatewayIndex: number;
  status: "alerte" | "normale";
  alerts: number;
  lat: number | null;
  lng: number | null;
}
