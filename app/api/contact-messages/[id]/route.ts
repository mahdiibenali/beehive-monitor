import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import {
  logAudit,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  diffFields,
} from "@/lib/audit/log";
import {
  toContactMessageListItem,
  type ContactMessageStatus,
} from "@/lib/contact/serializer";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES: ContactMessageStatus[] = ["new", "read", "handled"];

/**
 * GET /api/contact-messages/[id]
 *
 * Fetch a single message. Used by the deep-link drawer when the id is
 * not in the currently loaded page. Side-effect: if the caller has read
 * access AND the message is still `new`, mark it `read` so the unread
 * counter decrements as soon as someone opens it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "contact-messages.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const doc = await ContactMessage.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (doc.status === "new") {
      doc.status = "read";
      await doc.save();
      await logAudit({
        actor: session,
        action: AUDIT_ACTIONS.ContactMessageRead,
        entity: AUDIT_ENTITIES.ContactMessage,
        entityId: doc._id.toString(),
        summary: `${session.name} a ouvert un message de ${doc.firstName} ${doc.lastName}`,
        request,
      });
    }

    return NextResponse.json({
      item: toContactMessageListItem(doc.toObject()),
    });
  } catch (error) {
    console.error("GET /api/contact-messages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact message" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contact-messages/[id]
 *
 * Update the triage status of a message. Body: `{ status: "new" | "read" | "handled" }`.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "contact-messages.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextStatus =
    typeof body.status === "string"
      ? (body.status.trim() as ContactMessageStatus)
      : null;
  if (!nextStatus || !ALLOWED_STATUSES.includes(nextStatus)) {
    return NextResponse.json(
      { error: "Statut invalide." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const before = await ContactMessage.findById(id).lean();
    if (!before) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "handled") {
      update.handledBy = {
        id: session.id,
        name: session.name,
        role: session.role,
      };
      update.handledAt = new Date();
    } else if (before.status === "handled") {
      // Re-opening a previously handled message: clear the handler.
      update.handledBy = { id: null, name: "", role: "" };
      update.handledAt = null;
    }

    const doc = await ContactMessage.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const action =
      nextStatus === "handled"
        ? AUDIT_ACTIONS.ContactMessageHandle
        : before.status === "handled"
          ? AUDIT_ACTIONS.ContactMessageReopen
          : AUDIT_ACTIONS.ContactMessageRead;

    await logAudit({
      actor: session,
      action,
      entity: AUDIT_ENTITIES.ContactMessage,
      entityId: doc._id.toString(),
      summary:
        action === AUDIT_ACTIONS.ContactMessageHandle
          ? `${session.name} a marqué le message de ${doc.firstName} ${doc.lastName} comme traité`
          : action === AUDIT_ACTIONS.ContactMessageReopen
            ? `${session.name} a rouvert le message de ${doc.firstName} ${doc.lastName}`
            : `${session.name} a mis à jour un message de contact`,
      changes: diffFields(
        before as Record<string, unknown>,
        { status: nextStatus },
        ["status"]
      ),
      request,
    });

    return NextResponse.json({
      item: toContactMessageListItem(doc.toObject()),
    });
  } catch (error) {
    console.error("PATCH /api/contact-messages/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contact-messages/[id]
 *
 * Hard-delete a message (spam, etc.). Super-admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "contact-messages.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const doc = await ContactMessage.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await logAudit({
      actor: session,
      action: AUDIT_ACTIONS.ContactMessageDelete,
      entity: AUDIT_ENTITIES.ContactMessage,
      entityId: id,
      summary: `${session.name} a supprimé le message de ${doc.firstName} ${doc.lastName}`,
      metadata: { email: doc.email },
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/contact-messages/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
