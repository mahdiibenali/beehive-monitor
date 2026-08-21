import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth/current-user";
import { pushNotification } from "@/lib/notifications/server";
import { buildVisibilityFilter } from "@/lib/notifications/visibility";
import type { Role } from "@/lib/auth/roles";
import { ROLES } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

/** Shape returned to the client. */
interface NotificationDTO {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  actor: { id: string | null; name: string; role: string };
  createdAt: string;
  read: boolean;
  /** "user" for direct, "role" for broadcast. */
  scope: "user" | "role";
}

interface SerializableNotification {
  _id: mongoose.Types.ObjectId | string;
  title?: string;
  message?: string;
  type?: NotificationDTO["type"];
  link?: string | null;
  action?: string;
  entity?: string;
  entityId?: string | null;
  actor?: {
    id?: mongoose.Types.ObjectId | string | null;
    name?: string;
    role?: string;
  };
  readBy?: Array<mongoose.Types.ObjectId | string>;
  createdAt?: Date | string;
  userId?: mongoose.Types.ObjectId | string | null;
  role?: Role | null;
}

function serialize(
  doc: SerializableNotification,
  viewerId: string
): NotificationDTO {
  const readBy = (doc.readBy ?? []).map((id) => id.toString());
  return {
    _id: doc._id.toString(),
    title: doc.title ?? "",
    message: doc.message ?? "",
    type: doc.type ?? "info",
    link: doc.link ?? null,
    action: doc.action ?? "",
    entity: doc.entity ?? "",
    entityId: doc.entityId ?? null,
    actor: {
      id: doc.actor?.id ? doc.actor.id.toString() : null,
      name: doc.actor?.name ?? "",
      role: doc.actor?.role ?? "",
    },
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(doc.createdAt ?? Date.now()).toISOString(),
    read: readBy.includes(viewerId),
    scope: doc.userId ? "user" : "role",
  };
}

/**
 * GET /api/notifications
 *
 * Returns the latest notifications visible to the current user. Authenticated
 * users get both their direct notifications and any broadcast targeted at
 * their role, newest first.
 *
 * Query params:
 *   • `limit`  — 1..100 (default 30)
 *   • `unread` — "1" to filter only unread items
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT)
  );
  const onlyUnread = searchParams.get("unread") === "1";

  try {
    await connectToDatabase();
    const viewerId = new mongoose.Types.ObjectId(session.id);
    const baseFilter = buildVisibilityFilter({
      id: session.id,
      role: session.role,
      joinedAt: session.joinedAt,
    });
    const filter: Record<string, unknown> = { ...baseFilter };
    if (onlyUnread) {
      filter.readBy = { $ne: viewerId };
    }

    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({
        ...baseFilter,
        readBy: { $ne: viewerId },
      }),
    ]);

    return NextResponse.json({
      items: items.map((it) =>
        serialize(it as unknown as SerializableNotification, session.id)
      ),
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications  (super-admin only)
 * Body: { target: { userId } | { role }, message, title?, type?, link? }
 *
 * Lets the super-admin author a bespoke notification — useful for
 * announcements ("Maintenance prévue ce dimanche…").
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "super-admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 1) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type =
    body.type === "info" ||
    body.type === "success" ||
    body.type === "warning" ||
    body.type === "error"
      ? body.type
      : "info";
  const link = typeof body.link === "string" ? body.link.trim() : null;

  const target = body.target as { userId?: string; role?: string } | null;
  if (!target || typeof target !== "object") {
    return NextResponse.json({ error: "Cible manquante." }, { status: 400 });
  }
  if (target.userId) {
    if (!mongoose.Types.ObjectId.isValid(target.userId)) {
      return NextResponse.json(
        { error: "Identifiant utilisateur invalide." },
        { status: 400 }
      );
    }
    await pushNotification({
      target: { userId: target.userId },
      message,
      title,
      type,
      link,
      action: "admin.broadcast",
      actor: { id: session.id, name: session.name, role: session.role },
    });
  } else if (target.role) {
    if (!ROLES.includes(target.role as Role)) {
      return NextResponse.json(
        { error: "Rôle invalide." },
        { status: 400 }
      );
    }
    await pushNotification({
      target: { role: target.role as Role },
      message,
      title,
      type,
      link,
      action: "admin.broadcast",
      actor: { id: session.id, name: session.name, role: session.role },
    });
  } else {
    return NextResponse.json(
      { error: "Cible manquante (userId ou role)." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
