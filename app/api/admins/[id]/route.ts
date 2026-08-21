import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import {
  logAudit,
  diffFields,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
} from "@/lib/audit/log";
import {
  pushNotification,
  pushNotifications,
  type PushNotificationInput,
} from "@/lib/notifications/server";
import { toAdminListItem } from "@/lib/admins/serializer";
import { isValidAvatarSrc } from "@/lib/image";

type RouteContext = { params: Promise<{ id: string }> };

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/admins/[id] → `{ item }` — used by the admins client to honor
 * deep-links like `/admins?open=<id>` (e.g. from a notification) when the
 * target admin isn't on the page currently loaded by the list view.
 * Super-admin only.
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
  if (!canDo(session.role, "admins.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const doc = await User.findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: "admin",
    });
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item: toAdminListItem(doc) });
  } catch (error) {
    console.error("GET /api/admins/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admins/[id]
 * Body: { name?, email?, phone?, isActive?, password? }
 * Super-admin only.
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
  if (!canDo(session.role, "admins.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    isActive?: unknown;
    password?: unknown;
    avatarSrc?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  let passwordChanged = false;

  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (v.length < 2) {
      return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
    }
    update.name = v;
  }
  if (typeof body.email === "string") {
    const v = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    update.email = v;
  }
  if (typeof body.phone === "string") {
    update.phone = body.phone.trim();
  }
  if (typeof body.isActive === "boolean") {
    update.isActive = body.isActive;
  }
  if (body.avatarSrc !== undefined) {
    if (!isValidAvatarSrc(body.avatarSrc)) {
      return NextResponse.json(
        { error: "Image invalide ou trop volumineuse." },
        { status: 400 }
      );
    }
    update.avatarSrc = body.avatarSrc;
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Mot de passe trop court (min. 6 caractères)." },
        { status: 400 }
      );
    }
    update.passwordHash = await hashPassword(body.password);
    passwordChanged = true;
  }

  try {
    await connectToDatabase();

    const before = await User.findOne({ _id: id, role: "admin" }).lean();
    if (!before) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Make sure we never silently strip someone of their admin role.
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ item: toAdminListItem(before) });
    }

    if (update.email && update.email !== before.email) {
      const dup = await User.findOne({ email: update.email })
        .where({ _id: { $ne: id } })
        .lean();
      if (dup) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà." },
          { status: 409 }
        );
      }
    }

    const doc = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const beforeAvatarKey = before.avatarSrc ? "set" : "unset";
    const afterAvatarKey =
      typeof update.avatarSrc === "string" && update.avatarSrc !== ""
        ? "set"
        : update.avatarSrc === ""
        ? "unset"
        : undefined;

    const profileChanges = diffFields(
      {
        name: before.name,
        email: before.email,
        phone: before.phone ?? "",
        isActive: before.isActive ?? true,
        avatar: beforeAvatarKey,
      },
      {
        name: typeof update.name === "string" ? update.name : undefined,
        email: typeof update.email === "string" ? update.email : undefined,
        phone: typeof update.phone === "string" ? update.phone : undefined,
        isActive:
          typeof update.isActive === "boolean" ? update.isActive : undefined,
        avatar: afterAvatarKey,
      },
      ["name", "email", "phone", "isActive", "avatar"]
    );

    if (profileChanges.length > 0) {
      await logAudit({
        actor: session,
        action: AUDIT_ACTIONS.UserUpdate,
        entity: AUDIT_ENTITIES.User,
        entityId: id,
        summary: `${session.name} a modifié l'administrateur ${before.name}`,
        changes: profileChanges,
        request,
      });
    }

    if (passwordChanged) {
      await logAudit({
        actor: session,
        action: AUDIT_ACTIONS.UserChangePassword,
        entity: AUDIT_ENTITIES.User,
        entityId: id,
        summary: `${session.name} a réinitialisé le mot de passe de ${before.name}`,
        request,
      });
    }

    // ────────────────────────────────────────────────────────────────────
    // Notifications
    // ────────────────────────────────────────────────────────────────────
    if (profileChanges.length > 0 || passwordChanged) {
      const statusChanged = profileChanges.some(
        (c) => c.field === "isActive"
      );
      const notifs: PushNotificationInput[] = [];

      // Super-admin broadcast — keep the management team in the loop.
      notifs.push({
        target: { role: "super-admin" },
        message: passwordChanged && profileChanges.length === 0
          ? `${session.name} a réinitialisé le mot de passe de ${before.name}.`
          : statusChanged
          ? `${session.name} a ${
              doc.isActive ? "réactivé" : "désactivé"
            } l'administrateur ${before.name}.`
          : `${session.name} a modifié l'administrateur ${before.name}.`,
        type: statusChanged && !doc.isActive ? "warning" : "info",
        action: AUDIT_ACTIONS.UserUpdate,
        entity: AUDIT_ENTITIES.User,
        entityId: id,
        actor: { id: session.id, name: session.name, role: session.role },
      });

      // Direct notification for the admin themselves.
      if (passwordChanged) {
        notifs.push({
          target: { userId: id },
          title: "Mot de passe réinitialisé",
          message:
            "Votre mot de passe a été réinitialisé par un super administrateur.",
          type: "warning",
          action: AUDIT_ACTIONS.UserChangePassword,
          entity: AUDIT_ENTITIES.User,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        });
      }
      if (statusChanged) {
        notifs.push({
          target: { userId: id },
          title: doc.isActive ? "Compte réactivé" : "Compte désactivé",
          message: doc.isActive
            ? "Votre compte a été réactivé. Vous pouvez à nouveau vous connecter."
            : "Votre compte a été désactivé. Vous ne pouvez plus vous connecter.",
          type: doc.isActive ? "success" : "error",
          action: AUDIT_ACTIONS.UserUpdate,
          entity: AUDIT_ENTITIES.User,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        });
      } else if (profileChanges.length > 0) {
        notifs.push({
          target: { userId: id },
          message: "Votre profil a été mis à jour par un administrateur.",
          type: "info",
          action: AUDIT_ACTIONS.UserUpdate,
          entity: AUDIT_ENTITIES.User,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        });
      }

      await pushNotifications(notifs);
    }

    return NextResponse.json({ item: toAdminListItem(doc) });
  } catch (error) {
    console.error("PATCH /api/admins/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admins/[id]
 * Hard-delete (we keep the audit log entry as the trail).
 * Super-admin only — and you cannot delete your own account.
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
  if (!canDo(session.role, "admins.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.id === id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const doc = await User.findOneAndDelete({ _id: id, role: "admin" }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await logAudit({
      actor: session,
      action: AUDIT_ACTIONS.UserDelete,
      entity: AUDIT_ENTITIES.User,
      entityId: id,
      summary: `${session.name} a supprimé l'administrateur ${doc.name}`,
      metadata: {
        snapshot: {
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          isActive: doc.isActive,
          role: doc.role,
        },
      },
      request,
    });

    await pushNotification({
      target: { role: "super-admin" },
      message: `${session.name} a supprimé l'administrateur ${doc.name}.`,
      type: "warning",
      action: AUDIT_ACTIONS.UserDelete,
      entity: AUDIT_ENTITIES.User,
      entityId: id,
      actor: { id: session.id, name: session.name, role: session.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admins/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
