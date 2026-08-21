import "server-only";
import type { UserDocument } from "@/models/User";

/**
 * Plain shape of an admin row sent to the client. Never includes the
 * password hash and never includes mongoose internals.
 */
export interface AdminListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  avatarSrc: string;
  region: string;
  createdAt: string;
}

type LeanUser = Pick<
  UserDocument,
  "name" | "email" | "phone" | "isActive" | "avatarSrc" | "region"
> & {
  _id: { toString: () => string };
  createdAt?: Date;
};

export function toAdminListItem(doc: LeanUser): AdminListItem {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? "",
    isActive: doc.isActive ?? true,
    avatarSrc: doc.avatarSrc || "/brand/avatar-sample.svg",
    region: doc.region ?? "",
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
  };
}
