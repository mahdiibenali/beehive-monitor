import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";
import { User } from "@/models/User";
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
} from "@/lib/notifications/server"; // pushNotification reused by DELETE below
import { toApiculteurListItem } from "@/lib/apiculteurs/serializer";
import { sanitizeFermes, type SanitizedFerme } from "@/lib/apiculteurs/sanitize";
import { addMonths } from "@/lib/apiculteurs/subscription";
import { isValidAvatarSrc } from "@/lib/image";

type RouteContext = { params: Promise<{ id: string }> };
type Status = "active" | "expired" | "suspended";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/apiculteurs/[id] — single apiculteur for the detail panel.
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
  if (!canDo(session.role, "apiculteurs.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectToDatabase();
    const doc = await Apiculteur.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item: toApiculteurListItem(doc) });
  } catch (error) {
    console.error("GET /api/apiculteurs/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/apiculteurs/[id] — partial update with audit diff.
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
  if (!canDo(session.role, "apiculteurs.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

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
  if (typeof body.phone === "string") update.phone = body.phone.trim();
  if (typeof body.region === "string") update.region = body.region.trim();
  if (body.gender === "male" || body.gender === "female" || body.gender === "unknown") {
    update.gender = body.gender;
  }
  if (typeof body.address === "string") update.address = body.address.trim();
  if ("fermes" in body) {
    const cleaned = sanitizeFermes(body.fermes);
    update.fermes = cleaned;
    update.fermeCount = (cleaned as SanitizedFerme[]).length;
  }
  if (typeof body.rucheCount === "number" && body.rucheCount >= 0) {
    update.rucheCount = Math.floor(body.rucheCount);
  }
  if (typeof body.fermeCount === "number" && body.fermeCount >= 0) {
    update.fermeCount = Math.floor(body.fermeCount);
  }
  if (
    body.subscriptionStatus === "active" ||
    body.subscriptionStatus === "expired" ||
    body.subscriptionStatus === "suspended"
  ) {
    update.subscriptionStatus = body.subscriptionStatus as Status;
  }
  if ("subscriptionEndsAt" in body) {
    update.subscriptionEndsAt =
      typeof body.subscriptionEndsAt === "string" && body.subscriptionEndsAt
        ? new Date(body.subscriptionEndsAt)
        : null;
  }
  if (
    typeof body.subscriptionPeriodMonths === "number" &&
    body.subscriptionPeriodMonths >= 1
  ) {
    update.subscriptionPeriodMonths = Math.min(
      60,
      Math.floor(body.subscriptionPeriodMonths)
    );
  }
  if ("lat" in body) {
    update.lat = typeof body.lat === "number" ? body.lat : null;
  }
  if ("lng" in body) {
    update.lng = typeof body.lng === "number" ? body.lng : null;
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

  try {
    await connectToDatabase();
    const before = await Apiculteur.findById(id).lean();
    if (!before) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ item: toApiculteurListItem(before) });
    }

    if (update.email && update.email !== before.email) {
      const dup = await Apiculteur.findOne({ email: update.email })
        .where({ _id: { $ne: id } })
        .lean();
      if (dup) {
        return NextResponse.json(
          { error: "Un apiculteur avec cet email existe déjà." },
          { status: 409 }
        );
      }
    }

    // ────────────────────────────────────────────────────────────────────
    // Subscription lifecycle. We derive endsAt / suspendedAt / remainingMs
    // from the **status transition** instead of trusting the client.
    //
    //   • active   → suspended : pause the clock, snapshot remaining time
    //   • suspended → active   : resume — endsAt = now + remaining
    //   • expired  → active    : renew  — endsAt = now + period
    //   • period changed (active) : recompute endsAt = startedAt + period
    // ────────────────────────────────────────────────────────────────────
    const now = new Date();
    const prevStatus = before.subscriptionStatus ?? "active";
    const nextStatus = (update.subscriptionStatus ?? prevStatus) as Status;
    const prevEndsAt = before.subscriptionEndsAt
      ? new Date(before.subscriptionEndsAt)
      : null;
    const prevStartedAt = before.subscriptionStartedAt
      ? new Date(before.subscriptionStartedAt)
      : null;
    const prevRemainingMs = before.subscriptionRemainingMs ?? 0;
    const nextPeriod =
      typeof update.subscriptionPeriodMonths === "number"
        ? update.subscriptionPeriodMonths
        : before.subscriptionPeriodMonths ?? 1;

    const periodChanged =
      typeof update.subscriptionPeriodMonths === "number" &&
      update.subscriptionPeriodMonths !== before.subscriptionPeriodMonths;

    if (prevStatus !== nextStatus) {
      if (nextStatus === "suspended") {
        // Pause the clock. If endsAt is already in the past, remaining = 0.
        update.subscriptionSuspendedAt = now;
        update.subscriptionRemainingMs = prevEndsAt
          ? Math.max(0, prevEndsAt.getTime() - now.getTime())
          : 0;
      } else if (nextStatus === "active") {
        // Resume / renew.
        const remaining =
          prevStatus === "suspended" && prevRemainingMs > 0
            ? prevRemainingMs
            : null;
        update.subscriptionStartedAt = now;
        update.subscriptionEndsAt =
          remaining !== null
            ? new Date(now.getTime() + remaining)
            : addMonths(now, nextPeriod);
        update.subscriptionSuspendedAt = null;
        update.subscriptionRemainingMs = 0;
      } else if (nextStatus === "expired") {
        update.subscriptionEndsAt = now;
        update.subscriptionSuspendedAt = null;
        update.subscriptionRemainingMs = 0;
      }
    } else if (periodChanged && nextStatus === "active") {
      // Period changed without a status change → recompute endsAt from
      // the original start date so the user gets the full new duration.
      const startedAt = prevStartedAt ?? now;
      update.subscriptionEndsAt = addMonths(startedAt, nextPeriod);
    }

    const doc = await Apiculteur.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Mirror profile fields to the linked login account so the apiculteur
    // can keep signing in with the new email and sees the same name /
    // avatar / phone / region everywhere.
    if (doc.userId) {
      const userPatch: Record<string, unknown> = {};
      if (typeof update.name === "string") userPatch.name = update.name;
      if (typeof update.email === "string") userPatch.email = update.email;
      if (typeof update.phone === "string") userPatch.phone = update.phone;
      if (typeof update.region === "string") userPatch.region = update.region;
      if (typeof update.avatarSrc === "string") {
        userPatch.avatarSrc = update.avatarSrc;
      }
      if (Object.keys(userPatch).length > 0) {
        await User.updateOne({ _id: doc.userId }, { $set: userPatch }).catch(
          (err) => {
            console.error("Failed to sync linked user", err);
          }
        );
      }
    }

    const beforeAvatarKey = before.avatarSrc ? "set" : "unset";
    const afterAvatarKey =
      typeof update.avatarSrc === "string" && update.avatarSrc !== ""
        ? "set"
        : update.avatarSrc === ""
        ? "unset"
        : undefined;

    const changes = diffFields(
      {
        name: before.name,
        email: before.email,
        phone: before.phone ?? "",
        region: before.region ?? "",
        gender: before.gender ?? "unknown",
        rucheCount: before.rucheCount ?? 0,
        fermeCount: before.fermeCount ?? 0,
        subscriptionStatus: before.subscriptionStatus ?? "active",
        subscriptionPeriodMonths: before.subscriptionPeriodMonths ?? 1,
        avatar: beforeAvatarKey,
      },
      {
        name: typeof update.name === "string" ? update.name : undefined,
        email: typeof update.email === "string" ? update.email : undefined,
        phone: typeof update.phone === "string" ? update.phone : undefined,
        region: typeof update.region === "string" ? update.region : undefined,
        gender:
          update.gender === "male" ||
          update.gender === "female" ||
          update.gender === "unknown"
            ? update.gender
            : undefined,
        rucheCount:
          typeof update.rucheCount === "number" ? update.rucheCount : undefined,
        fermeCount:
          typeof update.fermeCount === "number" ? update.fermeCount : undefined,
        subscriptionStatus:
          update.subscriptionStatus === "active" ||
          update.subscriptionStatus === "expired" ||
          update.subscriptionStatus === "suspended"
            ? update.subscriptionStatus
            : undefined,
        subscriptionPeriodMonths:
          typeof update.subscriptionPeriodMonths === "number"
            ? update.subscriptionPeriodMonths
            : undefined,
        avatar: afterAvatarKey,
      },
      [
        "name",
        "email",
        "phone",
        "region",
        "gender",
        "rucheCount",
        "fermeCount",
        "subscriptionStatus",
        "subscriptionPeriodMonths",
        "avatar",
      ]
    );

    if (changes.length > 0) {
      await logAudit({
        actor: session,
        action: AUDIT_ACTIONS.ApiculteurUpdate,
        entity: AUDIT_ENTITIES.Apiculteur,
        entityId: id,
        summary: `${session.name} a modifié l'apiculteur ${before.name}`,
        changes,
        request,
      });
    }

    // ────────────────────────────────────────────────────────────────────
    // Notifications
    // ────────────────────────────────────────────────────────────────────
    // We surface two flavours:
    //   1. A super-admin broadcast for any meaningful change (so the
    //      management team sees what happened).
    //   2. A direct notification for the apiculteur themselves — with a
    //      dedicated copy when their subscription status changes.
    // Both are best-effort (pushNotification swallows errors).
    if (changes.length > 0) {
      const statusChanged = prevStatus !== nextStatus;
      const subscriptionMessages: Record<Status, string> = {
        active: "Votre abonnement a été activé avec succès.",
        expired: "Votre abonnement est désormais expiré.",
        suspended: "Votre abonnement a été suspendu.",
      };
      const subscriptionTypes: Record<Status, "success" | "warning" | "error"> = {
        active: "success",
        expired: "error",
        suspended: "warning",
      };

      const notifs: PushNotificationInput[] = [];

      // Super-admin broadcast.
      notifs.push({
        target: { role: "super-admin" },
        message: statusChanged
          ? `${session.name} a ${
              nextStatus === "active"
                ? "activé"
                : nextStatus === "suspended"
                ? "suspendu"
                : "marqué comme expiré"
            } l'abonnement de ${before.name}.`
          : `${session.name} a modifié l'apiculteur ${before.name}.`,
        type: statusChanged ? subscriptionTypes[nextStatus] : "info",
        action: AUDIT_ACTIONS.ApiculteurUpdate,
        entity: AUDIT_ENTITIES.Apiculteur,
        entityId: id,
        actor: { id: session.id, name: session.name, role: session.role },
      });

      // Direct notification to the apiculteur.
      if (doc.userId) {
        notifs.push({
          target: { userId: doc.userId },
          title: statusChanged ? "Statut de l'abonnement" : undefined,
          message: statusChanged
            ? subscriptionMessages[nextStatus]
            : "Votre profil a été mis à jour par un administrateur.",
          type: statusChanged ? subscriptionTypes[nextStatus] : "info",
          action: statusChanged
            ? "apiculteur.subscription.change"
            : AUDIT_ACTIONS.ApiculteurUpdate,
          entity: AUDIT_ENTITIES.Apiculteur,
          entityId: id,
          actor: { id: session.id, name: session.name, role: session.role },
        });
      }

      await pushNotifications(notifs);
    }

    return NextResponse.json({ item: toApiculteurListItem(doc) });
  } catch (error) {
    console.error("PATCH /api/apiculteurs/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apiculteurs/[id] — hard delete with audit snapshot.
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
  if (!canDo(session.role, "apiculteurs.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const doc = await Apiculteur.findByIdAndDelete(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Remove the linked login account so the email is freed up and the
    // apiculteur can no longer sign in.
    if (doc.userId) {
      await User.deleteOne({ _id: doc.userId }).catch((err) => {
        console.error("Failed to delete linked user", err);
      });
    }

    await logAudit({
      actor: session,
      action: AUDIT_ACTIONS.ApiculteurDelete,
      entity: AUDIT_ENTITIES.Apiculteur,
      entityId: id,
      summary: `${session.name} a supprimé l'apiculteur ${doc.name}`,
      metadata: {
        snapshot: {
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          region: doc.region,
          rucheCount: doc.rucheCount,
          fermeCount: doc.fermeCount,
          subscriptionStatus: doc.subscriptionStatus,
        },
      },
      request,
    });

    await pushNotification({
      target: { role: "super-admin" },
      message: `${session.name} a supprimé l'apiculteur ${doc.name}.`,
      type: "warning",
      action: AUDIT_ACTIONS.ApiculteurDelete,
      entity: AUDIT_ENTITIES.Apiculteur,
      entityId: id,
      actor: { id: session.id, name: session.name, role: session.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/apiculteurs/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
