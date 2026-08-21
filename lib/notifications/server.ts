import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import type { Role } from "@/lib/auth/roles";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface PushTargetUser {
  userId: string | mongoose.Types.ObjectId;
}
export interface PushTargetRole {
  role: Role;
}
export type PushTarget = PushTargetUser | PushTargetRole;

export interface PushNotificationInput {
  target: PushTarget;
  message: string;
  title?: string;
  type?: NotificationType;
  link?: string | null;
  action?: string;
  entity?: string;
  entityId?: string | null;
  actor?: {
    id?: string | mongoose.Types.ObjectId | null;
    name?: string;
    role?: string;
  } | null;
  meta?: Record<string, unknown>;
}

/**
 * Write a single notification. Best-effort — errors are swallowed and
 * logged so a failed notification never breaks the underlying mutation.
 */
export async function pushNotification(
  input: PushNotificationInput
): Promise<void> {
  try {
    await connectToDatabase();
    const doc: Record<string, unknown> = {
      title: input.title?.trim() ?? "",
      message: input.message.trim(),
      type: input.type ?? "info",
      link: input.link ?? null,
      action: input.action ?? "",
      entity: input.entity ?? "",
      entityId: input.entityId ?? null,
      actor: input.actor
        ? {
            id: input.actor.id ?? null,
            name: input.actor.name ?? "",
            role: input.actor.role ?? "",
          }
        : { id: null, name: "", role: "" },
      meta: input.meta ?? {},
      userId: null,
      role: null,
    };

    if ("userId" in input.target && input.target.userId) {
      doc.userId = input.target.userId;
    } else if ("role" in input.target && input.target.role) {
      doc.role = input.target.role;
    } else {
      // No target — nothing to do.
      return;
    }

    await Notification.create(doc);
  } catch (err) {
    console.error("pushNotification failed:", err);
  }
}

/** Convenience: fan-out a list of notifications in parallel. */
export async function pushNotifications(
  inputs: PushNotificationInput[]
): Promise<void> {
  await Promise.all(inputs.map(pushNotification));
}
