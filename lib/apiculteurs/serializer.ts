import "server-only";
import type { ApiculteurDocument } from "@/models/Apiculteur";
import { deriveStatus } from "@/lib/apiculteurs/subscription";

export interface FermeItem {
  id: string;
  name: string;
  rucheCount: number;
  address: string;
  plusCode: string;
  lat: number | null;
  lng: number | null;
}

/**
 * Plain shape of an apiculteur row sent to the client.
 * Dates are ISO strings; never includes mongoose internals.
 */
export type SubscriptionStatus = "active" | "expired" | "suspended";
export type Gender = "male" | "female" | "unknown";

export interface ApiculteurListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarSrc: string;
  region: string;
  gender: Gender;
  rucheCount: number;
  fermeCount: number;
  /** Raw status as stored in DB (super-admin choice). */
  subscriptionStatus: SubscriptionStatus;
  /**
   * Computed status considering auto-expiry. Same as
   * `subscriptionStatus` except active rows past `subscriptionEndsAt`
   * are reported as `expired`.
   */
  effectiveStatus: SubscriptionStatus;
  /** Duration of the current subscription cycle, in months. */
  subscriptionPeriodMonths: number;
  /** When the current cycle started. */
  subscriptionStartedAt: string | null;
  /** Date the subscription expires (or expired). */
  subscriptionEndsAt: string | null;
  /** Date of the last suspension, if currently suspended. */
  subscriptionSuspendedAt: string | null;
  /** Remaining time at the moment of suspension, in milliseconds. */
  subscriptionRemainingMs: number;
  lat: number | null;
  lng: number | null;
  address: string;
  fermes: FermeItem[];
  createdAt: string;
}

type LeanFerme = {
  _id?: { toString: () => string } | string;
  name?: string;
  rucheCount?: number;
  address?: string;
  plusCode?: string;
  lat?: number | null;
  lng?: number | null;
};

type LeanApiculteur = Pick<
  ApiculteurDocument,
  | "name"
  | "email"
  | "phone"
  | "avatarSrc"
  | "region"
  | "rucheCount"
  | "fermeCount"
  | "subscriptionStatus"
  | "subscriptionEndsAt"
  | "lat"
  | "lng"
  | "address"
  | "gender"
> & {
  _id: { toString: () => string };
  createdAt?: Date;
  fermes?: LeanFerme[];
  subscriptionPeriodMonths?: number;
  subscriptionStartedAt?: Date | null;
  subscriptionSuspendedAt?: Date | null;
  subscriptionRemainingMs?: number;
};

function fermeId(raw: LeanFerme["_id"]): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.toString();
}

export function toApiculteurListItem(doc: LeanApiculteur): ApiculteurListItem {
  const status = (doc.subscriptionStatus ?? "active") as SubscriptionStatus;
  const endsAt = doc.subscriptionEndsAt
    ? new Date(doc.subscriptionEndsAt)
    : null;
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? "",
    avatarSrc: doc.avatarSrc || "/brand/avatar-sample.svg",
    region: doc.region ?? "",
    gender: (doc.gender as Gender) ?? "unknown",
    rucheCount: doc.rucheCount ?? 0,
    fermeCount: doc.fermeCount ?? 0,
    subscriptionStatus: status,
    effectiveStatus: deriveStatus({ status, endsAt }),
    subscriptionPeriodMonths: doc.subscriptionPeriodMonths ?? 1,
    subscriptionStartedAt: doc.subscriptionStartedAt
      ? new Date(doc.subscriptionStartedAt).toISOString()
      : null,
    subscriptionEndsAt: endsAt ? endsAt.toISOString() : null,
    subscriptionSuspendedAt: doc.subscriptionSuspendedAt
      ? new Date(doc.subscriptionSuspendedAt).toISOString()
      : null,
    subscriptionRemainingMs: doc.subscriptionRemainingMs ?? 0,
    lat: doc.lat ?? null,
    lng: doc.lng ?? null,
    address: doc.address ?? "",
    fermes: (doc.fermes ?? []).map((f) => ({
      id: fermeId(f._id),
      name: f.name ?? "",
      rucheCount: f.rucheCount ?? 0,
      address: f.address ?? "",
      plusCode: f.plusCode ?? "",
      lat: f.lat ?? null,
      lng: f.lng ?? null,
    })),
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
  };
}
