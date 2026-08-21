import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Maintenance } from "@/models/Maintenance";
import { Apiculteur } from "@/models/Apiculteur";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/log";
import { pushNotification, pushNotifications } from "@/lib/notifications/server";
import { toMaintenanceListItem } from "@/lib/maintenance/serializer";
import { resolveApiculteurLive } from "@/lib/maintenance/resolve-user-id";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * POST /api/maintenance/[id]/replies
 *
 * Append a reply to the ticket thread.
 *
 * Authorization:
 *   • super-admin / admin can reply on any ticket
 *   • apiculteur can only reply on their **own** ticket (matched by the
 *     ticket's `apiculteurId` against the apiculteur record linked to
 *     the caller's email)
 *
 * Side effects:
 *   • bumps `lastActivityAt`
 *   • pushes a notification to the "other side" of the conversation
 *     (apiculteur → super-admin role; admin → apiculteur's linked User)
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "maintenance.reply")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { body?: unknown };
  try {
    body = (await request.json()) as { body?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (text.length < 1) {
    return NextResponse.json(
      { error: "Le message ne peut pas être vide." },
      { status: 400 }
    );
  }
  if (text.length > 4000) {
    return NextResponse.json(
      { error: "Message trop long (max 4000 caractères)." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const ticket = await Maintenance.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Apiculteurs may only post on their own thread.
    if (session.role === "apiculteur") {
      const me = await Apiculteur.findOne({ email: session.email })
        .select("_id")
        .lean();
      if (!me || !ticket.apiculteurId || me._id.toString() !== ticket.apiculteurId.toString()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const now = new Date();
    // Author avatar: try the live User record (more up-to-date than the
    // session cookie).
    const user = await User.findById(session.id)
      .select("avatarSrc")
      .lean();

    ticket.replies.push({
      authorId: new mongoose.Types.ObjectId(session.id),
      authorName: session.name,
      authorRole: session.role,
      authorAvatarSrc: user?.avatarSrc ?? "",
      body: text,
      createdAt: now,
    });
    ticket.lastActivityAt = now;
    await ticket.save();

    await logAudit({
      actor: session,
      action: AUDIT_ACTIONS.MaintenanceReply,
      entity: AUDIT_ENTITIES.Maintenance,
      entityId: id,
      summary: `${session.name} a répondu à la demande "${ticket.title}"`,
      metadata: { preview: text.slice(0, 80) },
      request,
    });

    // Notify the other side of the conversation.
    const preview = `${text.slice(0, 80)}${text.length > 80 ? "…" : ""}`;
    if (session.role === "apiculteur") {
      // Apiculteur replied → ping every staff member that handles
      // maintenance (super-admin + admin). The self-author filter still
      // applies, so an apiculteur replying never gets their own ping.
      await pushNotifications([
        {
          target: { role: "super-admin" },
          title: "Nouvelle réponse",
          message: `${session.name} a répondu : "${preview}"`,
          type: "info",
          action: AUDIT_ACTIONS.MaintenanceReply,
          entity: AUDIT_ENTITIES.Maintenance,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        },
        {
          target: { role: "admin" },
          title: "Nouvelle réponse",
          message: `${session.name} a répondu : "${preview}"`,
          type: "info",
          action: AUDIT_ACTIONS.MaintenanceReply,
          entity: AUDIT_ENTITIES.Maintenance,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        },
      ]);
    } else {
      // Admin / super-admin replied → ping the apiculteur (via linked
      // User) AND the rest of the staff team so the conversation stays
      // visible to colleagues. Self is filtered by the notifications API.
      const staffFanOut = pushNotifications([
        {
          target: { role: "super-admin" },
          title: "Nouvelle réponse",
          message: `${session.name} a répondu : "${preview}"`,
          type: "info",
          action: AUDIT_ACTIONS.MaintenanceReply,
          entity: AUDIT_ENTITIES.Maintenance,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        },
        {
          target: { role: "admin" },
          title: "Nouvelle réponse",
          message: `${session.name} a répondu : "${preview}"`,
          type: "info",
          action: AUDIT_ACTIONS.MaintenanceReply,
          entity: AUDIT_ENTITIES.Maintenance,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        },
      ]);

      if (ticket.apiculteurId) {
        const apiculteur = await Apiculteur.findById(ticket.apiculteurId)
          .select("userId")
          .lean();
        if (apiculteur?.userId) {
          await pushNotification({
            target: { userId: apiculteur.userId },
            title: "Réponse à votre demande",
            message: `${session.name} : "${preview}"`,
            type: "info",
            action: AUDIT_ACTIONS.MaintenanceReply,
            entity: AUDIT_ENTITIES.Maintenance,
            entityId: id,
            actor: { id: session.id, name: session.name, role: session.role },
          });
        }
      }

      await staffFanOut;
    }

    const fresh = await Maintenance.findById(id).lean();
    const live = await resolveApiculteurLive(fresh!.apiculteurId);
    return NextResponse.json(
      {
        item: toMaintenanceListItem(fresh!, live.userId, live.avatarSrc),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/maintenance/[id]/replies error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
