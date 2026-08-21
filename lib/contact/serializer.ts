import type { ContactMessageDocument } from "@/models/ContactMessage";

export type ContactMessageStatus = "new" | "read" | "handled";

export interface ContactMessageListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  message: string;
  status: ContactMessageStatus;
  handledBy: { id: string | null; name: string; role: string } | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert a Mongoose `ContactMessage` doc (lean or hydrated) into the
 * plain JSON shape the UI consumes.
 */
export function toContactMessageListItem(
  doc: Partial<ContactMessageDocument> & {
    _id: ContactMessageDocument["_id"];
    createdAt?: Date;
    updatedAt?: Date;
  }
): ContactMessageListItem {
  const handledByRaw = doc.handledBy as
    | { id?: unknown; name?: string; role?: string }
    | null
    | undefined;
  const handledById =
    handledByRaw && handledByRaw.id ? String(handledByRaw.id) : null;

  return {
    id: doc._id.toString(),
    firstName: doc.firstName ?? "",
    lastName: doc.lastName ?? "",
    fullName: `${doc.firstName ?? ""} ${doc.lastName ?? ""}`.trim(),
    email: doc.email ?? "",
    message: doc.message ?? "",
    status: (doc.status as ContactMessageStatus) ?? "new",
    handledBy:
      handledByRaw && (handledById || handledByRaw.name)
        ? {
            id: handledById,
            name: handledByRaw.name ?? "",
            role: handledByRaw.role ?? "",
          }
        : null,
    handledAt: doc.handledAt ? new Date(doc.handledAt).toISOString() : null,
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
    updatedAt: (doc.updatedAt ?? doc.createdAt ?? new Date()).toISOString(),
  };
}
