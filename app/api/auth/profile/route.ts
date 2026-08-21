import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Apiculteur } from "@/models/Apiculteur";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getCurrentUser, toSessionUser } from "@/lib/auth/current-user";
import {
  logAudit,
  diffFields,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
} from "@/lib/audit/log";
import { isValidAvatarSrc } from "@/lib/image";

/**
 * PATCH /api/auth/profile
 * Body: { name?: string; phone?: string; password?: string; oldPassword?: string }
 *
 * Updates the current user. Only the fields present in the body are touched.
 * If `password` is provided, `oldPassword` is required and must match the
 * current account password. Returns the refreshed { user } payload (without
 * the password hash).
 */
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    name?: unknown;
    phone?: unknown;
    genre?: unknown;
    region?: unknown;
    avatarSrc?: unknown;
    password?: unknown;
    oldPassword?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
    }
    update.name = name;
  }

  if (typeof body.phone === "string") {
    const phone = body.phone.trim();
    if (phone.length > 32) {
      return NextResponse.json(
        { error: "Numéro de téléphone trop long." },
        { status: 400 }
      );
    }
    update.phone = phone;
  }

  if (typeof body.genre === "string") {
    const genre = body.genre.trim();
    if (genre.length > 32) {
      return NextResponse.json({ error: "Genre invalide." }, { status: 400 });
    }
    update.genre = genre;
  }

  if (typeof body.region === "string") {
    const region = body.region.trim();
    if (region.length > 100) {
      return NextResponse.json({ error: "Région invalide." }, { status: 400 });
    }
    update.region = region;
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

  const wantsPasswordChange =
    typeof body.password === "string" && body.password.length > 0;

  if (wantsPasswordChange) {
    const password = body.password as string;
    const oldPassword =
      typeof body.oldPassword === "string" ? body.oldPassword : "";

    if (password.length < 6 || password.length > 200) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }
    if (!oldPassword) {
      return NextResponse.json(
        { error: "Veuillez saisir votre mot de passe actuel." },
        { status: 400 }
      );
    }
    if (oldPassword === password) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit être différent de l'ancien." },
        { status: 400 }
      );
    }
  }

  try {
    await connectToDatabase();

    if (wantsPasswordChange) {
      const doc = await User.findById(session.id).select("+passwordHash");
      if (!doc || !doc.passwordHash) {
        return NextResponse.json(
          { error: "Utilisateur introuvable." },
          { status: 404 }
        );
      }
      const ok = await verifyPassword(
        body.oldPassword as string,
        doc.passwordHash
      );
      if (!ok) {
        await logAudit({
          actor: session,
          action: AUDIT_ACTIONS.UserChangePassword,
          entity: AUDIT_ENTITIES.User,
          entityId: session.id,
          status: "failure",
          summary: `Échec changement de mot de passe — ancien mot de passe incorrect`,
          request,
        });
        return NextResponse.json(
          { error: "Ancien mot de passe incorrect." },
          { status: 400 }
        );
      }
      update.passwordHash = await hashPassword(body.password as string);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ user: session });
    }

    const before = await User.findById(session.id).lean();

    const doc = await User.findByIdAndUpdate(session.id, update, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    // When the actor is an apiculteur, keep the matching Apiculteur record
    // in sync so the management page, the maintenance snapshots and the
    // profile preview all show the same name / phone / avatar. The link is
    // by email (our current join key) and the write is best-effort.
    if (session.role === "apiculteur" && session.email) {
      const apiculteurPatch: Record<string, unknown> = {};
      if (typeof update.name === "string") apiculteurPatch.name = update.name;
      if (typeof update.phone === "string") apiculteurPatch.phone = update.phone;
      if (typeof update.avatarSrc === "string")
        apiculteurPatch.avatarSrc = update.avatarSrc;
      if (Object.keys(apiculteurPatch).length > 0) {
        try {
          await Apiculteur.updateOne(
            { email: session.email },
            { $set: apiculteurPatch }
          );
        } catch (e) {
          console.error("Apiculteur sync from /api/auth/profile failed", e);
        }
      }
    }

    if (wantsPasswordChange) {
      await logAudit({
        actor: session,
        action: AUDIT_ACTIONS.UserChangePassword,
        entity: AUDIT_ENTITIES.User,
        entityId: session.id,
        summary: `${session.name} a changé son mot de passe`,
        request,
      });
    }

    // Compare scalars + a coarse "avatar changed" flag (the actual data URI
    // is far too large to dump in the audit changelog).
    const beforeAvatarKey = before?.avatarSrc ? "set" : "unset";
    const afterAvatarKey =
      typeof update.avatarSrc === "string" && update.avatarSrc !== ""
        ? "set"
        : update.avatarSrc === ""
        ? "unset"
        : undefined;

    const profileChanges = before
      ? diffFields(
          {
            name: before.name,
            phone: before.phone ?? "",
            genre: before.genre ?? "",
            region: before.region ?? "",
            avatar: beforeAvatarKey,
          },
          {
            name: typeof update.name === "string" ? update.name : undefined,
            phone:
              typeof update.phone === "string" ? update.phone : undefined,
            genre:
              typeof update.genre === "string" ? update.genre : undefined,
            region:
              typeof update.region === "string" ? update.region : undefined,
            avatar: afterAvatarKey,
          },
          ["name", "phone", "genre", "region", "avatar"]
        )
      : [];

    if (profileChanges.length > 0) {
      await logAudit({
        actor: session,
        action: AUDIT_ACTIONS.UserUpdateProfile,
        entity: AUDIT_ENTITIES.User,
        entityId: session.id,
        summary: `${session.name} a mis à jour son profil`,
        changes: profileChanges,
        request,
      });
    }

    return NextResponse.json({ user: toSessionUser(doc) });
  } catch (error) {
    console.error("PATCH /api/auth/profile error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
