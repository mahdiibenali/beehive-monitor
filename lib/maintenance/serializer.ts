import mongoose from "mongoose";
import type { MaintenanceDocument } from "@/models/Maintenance";

export type MaintenanceStatus = "non-traite" | "traite";

export interface MaintenanceReply {
  id: string;
  authorId: string | null;
  authorName: string;
  authorRole: string;
  authorAvatarSrc: string;
  body: string;
  createdAt: string;
}

export interface MaintenanceListItem {
  id: string;
  apiculteurId: string | null;
  /** User account linked to the apiculteur (for the profile preview).
   *  Resolved at API time — not stored on the document. */
  apiculteurUserId: string | null;
  apiculteur: {
    name: string;
    email: string;
    phone: string;
    avatarSrc: string;
    rucheCount: number;
    fermeCount: number;
    inscriptionAt: string | null;
  };
  title: string;
  description: string;
  status: MaintenanceStatus;
  startedAt: string | null;
  dueAt: string | null;
  treatedAt: string | null;
  treatedBy: { id: string | null; name: string; role: string };
  attachmentUrl: string;
  replies: MaintenanceReply[];
  replyCount: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SerializableReply {
  _id?: mongoose.Types.ObjectId | string;
  authorId?: mongoose.Types.ObjectId | string | null;
  authorName?: string;
  authorRole?: string;
  authorAvatarSrc?: string;
  body?: string;
  createdAt?: Date | string;
}

interface SerializableMaintenance {
  _id: mongoose.Types.ObjectId | string;
  apiculteurId?: mongoose.Types.ObjectId | string | null;
  apiculteurSnapshot?: {
    name?: string;
    email?: string;
    phone?: string;
    avatarSrc?: string;
    rucheCount?: number;
    fermeCount?: number;
    inscriptionAt?: Date | string | null;
  };
  title?: string;
  description?: string;
  status?: MaintenanceStatus;
  startedAt?: Date | string | null;
  dueAt?: Date | string | null;
  treatedAt?: Date | string | null;
  treatedBy?: {
    id?: mongoose.Types.ObjectId | string | null;
    name?: string;
    role?: string;
  };
  attachmentUrl?: string;
  replies?: SerializableReply[];
  lastActivityAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function serializeReply(r: SerializableReply): MaintenanceReply {
  return {
    id: r._id ? r._id.toString() : "",
    authorId: r.authorId ? r.authorId.toString() : null,
    authorName: r.authorName ?? "",
    authorRole: r.authorRole ?? "",
    authorAvatarSrc: r.authorAvatarSrc ?? "",
    body: r.body ?? "",
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : new Date(r.createdAt ?? Date.now()).toISOString(),
  };
}

export function toMaintenanceListItem(
  doc: SerializableMaintenance,
  /** Optional user-id mapping (apiculteurId → userId) so the list view
   *  can open the sender's profile preview without a second roundtrip. */
  apiculteurUserId?: string | null,
  /** Optional live avatar URL fetched from the Apiculteur record, used
   *  to override a stale snapshot when the apiculteur changed their
   *  profile picture after the ticket was filed. */
  liveAvatarSrc?: string | null
): MaintenanceListItem {
  const snap = doc.apiculteurSnapshot ?? {};
  const replies = (doc.replies ?? []).map(serializeReply);
  const avatarSrc =
    (liveAvatarSrc && liveAvatarSrc.length > 0
      ? liveAvatarSrc
      : snap.avatarSrc) ?? "";
  return {
    id: doc._id.toString(),
    apiculteurId: doc.apiculteurId ? doc.apiculteurId.toString() : null,
    apiculteurUserId: apiculteurUserId ?? null,
    apiculteur: {
      name: snap.name ?? "",
      email: snap.email ?? "",
      phone: snap.phone ?? "",
      avatarSrc,
      rucheCount: snap.rucheCount ?? 0,
      fermeCount: snap.fermeCount ?? 0,
      inscriptionAt: iso(snap.inscriptionAt ?? null),
    },
    title: doc.title ?? "",
    description: doc.description ?? "",
    status: doc.status ?? "non-traite",
    startedAt: iso(doc.startedAt ?? null),
    dueAt: iso(doc.dueAt ?? null),
    treatedAt: iso(doc.treatedAt ?? null),
    treatedBy: {
      id: doc.treatedBy?.id ? doc.treatedBy.id.toString() : null,
      name: doc.treatedBy?.name ?? "",
      role: doc.treatedBy?.role ?? "",
    },
    attachmentUrl: doc.attachmentUrl ?? "",
    replies,
    replyCount: replies.length,
    lastActivityAt: iso(doc.lastActivityAt ?? null),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(doc.createdAt ?? Date.now()).toISOString(),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : new Date(doc.updatedAt ?? Date.now()).toISOString(),
  };
}

/**
 * Erase the `MaintenanceDocument` complex Mongoose typing — useful when
 * we pass a `.lean()` result around without going through `as unknown as`.
 */
export type MaintenanceLean = MaintenanceDocument | SerializableMaintenance;
