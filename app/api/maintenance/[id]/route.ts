import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Maintenance } from "@/models/Maintenance";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import {
  logAudit,
  diffFields,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
} from "@/lib/audit/log";
import { pushNotification, pushNotifications } from "@/lib/notifications/server";
import { toMaintenanceListItem } from "@/lib/maintenance/serializer";
import { resolveApiculteurLive } from "@/lib/maintenance/resolve-user-id";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
type Status = "non-traite" | "traite";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/maintenance/[id] — single demand for the detail drawer.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "maintenance.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectToDatabase();
    const doc = await Maintenance.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    {
      const live = await resolveApiculteurLive(doc.apiculteurId);
      return NextResponse.json({
        item: toMaintenanceListItem(doc, live.userId, live.avatarSrc),
      });
    }
  } catch (error) {
    console.error("GET /api/maintenance/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/maintenance/[id]
 *
 * Body:
 *   • `status`       — "traite" | "non-traite" (toggles treatedAt / treatedBy)
 *   • `title`        — string
 *   • `description`  — string
 *   • `startedAt`    — ISO
 *   • `dueAt`        — ISO | null
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "maintenance.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  let nextStatus: Status | null = null;

  if (typeof body.title === "string") {
    const v = body.title.trim();
    if (v.length < 2) {
      return NextResponse.json({ error: "Titre invalide." }, { status: 400 });
    }
    update.title = v;
  }
  if (typeof body.description === "string") {
    update.description = body.description.trim();
  }
  if (typeof body.startedAt === "string" && body.startedAt) {
    update.startedAt = new Date(body.startedAt);
  }
  if ("dueAt" in body) {
    update.dueAt =
      typeof body.dueAt === "string" && body.dueAt ? new Date(body.dueAt) : null;
  }
  if (body.status === "traite" || body.status === "non-traite") {
    nextStatus = body.status;
    update.status = body.status;
  }

  try {
    await connectToDatabase();
    const before = await Maintenance.findById(id).lean();
    if (!before) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (Object.keys(update).length === 0) {
      const live = await resolveApiculteurLive(before.apiculteurId);
      return NextResponse.json({
        item: toMaintenanceListItem(before, live.userId, live.avatarSrc),
      });
    }

    // Stamp treatedAt / treatedBy when transitioning to "traite".
    if (nextStatus && nextStatus !== before.status) {
      if (nextStatus === "traite") {
        update.treatedAt = new Date();
        update.treatedBy = {
          id: new mongoose.Types.ObjectId(session.id),
          name: session.name,
          role: session.role,
        };
      } else {
        update.treatedAt = null;
        update.treatedBy = { id: null, name: "", role: "" };
      }
    }

    // Any successful PATCH counts as activity.
    update.lastActivityAt = new Date();

    const doc = await Maintenance.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const changes = diffFields(
      {
        title: before.title,
        description: before.description ?? "",
        status: before.status,
      },
      {
        title: typeof update.title === "string" ? update.title : undefined,
        description:
          typeof update.description === "string"
            ? update.description
            : undefined,
        status:
          update.status === "traite" || update.status === "non-traite"
            ? update.status
            : undefined,
      },
      ["title", "description", "status"]
    );

    const statusChanged =
      nextStatus !== null && nextStatus !== before.status;

    if (changes.length > 0) {
      await logAudit({
        actor: session,
        action: statusChanged
          ? nextStatus === "traite"
            ? AUDIT_ACTIONS.MaintenanceResolve
            : AUDIT_ACTIONS.MaintenanceReopen
          : AUDIT_ACTIONS.MaintenanceUpdate,
        entity: AUDIT_ENTITIES.Maintenance,
        entityId: id,
        summary: statusChanged
          ? `${session.name} a ${
              nextStatus === "traite" ? "marqué comme traitée" : "réouvert"
            } la demande "${before.title}"`
          : `${session.name} a modifié la demande "${before.title}"`,
        changes,
        request,
      });
    }

    // Fan out a notification on status change:
    //   • the apiculteur whose ticket was treated / reopened (via their
    //     linked User account)
    //   • every other staff member (super-admin + admin) — the self-author
    //     filter in the notifications API hides the action from the actor.
    if (statusChanged) {
      const action =
        nextStatus === "traite"
          ? AUDIT_ACTIONS.MaintenanceResolve
          : AUDIT_ACTIONS.MaintenanceReopen;
      const type = nextStatus === "traite" ? "success" : "info";
      const staffMessage =
        nextStatus === "traite"
          ? `${session.name} a marqué la demande "${before.title}" (${before.apiculteurSnapshot?.name ?? "?"}) comme traitée.`
          : `${session.name} a réouvert la demande "${before.title}" (${before.apiculteurSnapshot?.name ?? "?"}).`;

      await pushNotifications([
        {
          target: { role: "super-admin" },
          title: "Maintenance",
          message: staffMessage,
          type,
          action,
          entity: AUDIT_ENTITIES.Maintenance,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        },
        {
          target: { role: "admin" },
          title: "Maintenance",
          message: staffMessage,
          type,
          action,
          entity: AUDIT_ENTITIES.Maintenance,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        },
      ]);

      if (before.apiculteurId) {
        const ownerMessage =
          nextStatus === "traite"
            ? `Votre demande "${before.title}" a été traitée.`
            : `Votre demande "${before.title}" est de nouveau en attente.`;

        const { Apiculteur } = await import("@/models/Apiculteur");
        const apiculteur = await Apiculteur.findById(before.apiculteurId)
          .select("userId")
          .lean();
        if (apiculteur?.userId) {
          await pushNotification({
            target: { userId: apiculteur.userId },
            title: "Maintenance",
            message: ownerMessage,
            type,
            action,
            entity: AUDIT_ENTITIES.Maintenance,
            entityId: id,
            actor: { id: session.id, name: session.name, role: session.role },
          });
        }
      }
    }

    {
      const live = await resolveApiculteurLive(doc.apiculteurId);
      return NextResponse.json({
        item: toMaintenanceListItem(doc, live.userId, live.avatarSrc),
      });
    }
  } catch (error) {
    console.error("PATCH /api/maintenance/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/maintenance/[id] — hard delete, super-admin only.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "maintenance.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const doc = await Maintenance.findByIdAndDelete(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await logAudit({
      actor: session,
      action: AUDIT_ACTIONS.MaintenanceDelete,
      entity: AUDIT_ENTITIES.Maintenance,
      entityId: id,
      summary: `${session.name} a supprimé la demande "${doc.title}"`,
      metadata: {
        snapshot: {
          title: doc.title,
          status: doc.status,
          apiculteur: doc.apiculteurSnapshot?.email ?? null,
        },
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/maintenance/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
