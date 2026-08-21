import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { writeSessionCookie } from "@/lib/auth/session";
import { toSessionUser } from "@/lib/auth/current-user";
import { checkApiculteurAccess } from "@/lib/auth/subscription-gate";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/log";

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Sets the session cookie on success and returns the user payload.
 */
export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password =
    typeof body.password === "string" ? body.password.trim() : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Must select passwordHash explicitly (`select: false` on the schema).
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !user.isActive) {
      await logAudit({
        actor: { email },
        action: AUDIT_ACTIONS.AuthLoginFailed,
        entity: AUDIT_ENTITIES.Auth,
        status: "failure",
        summary: `Tentative de connexion échouée pour ${email}`,
        metadata: { reason: !user ? "user-not-found" : "inactive" },
        request,
      });
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      console.error(
        `Login blocked: user ${email} has no passwordHash. Run: npm run seed`
      );
      await logAudit({
        actor: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
        action: AUDIT_ACTIONS.AuthLoginFailed,
        entity: AUDIT_ENTITIES.Auth,
        status: "failure",
        summary: `Connexion impossible — aucun mot de passe défini pour ${email}`,
        metadata: { reason: "no-password-hash" },
        request,
      });
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      await logAudit({
        actor: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
        action: AUDIT_ACTIONS.AuthLoginFailed,
        entity: AUDIT_ENTITIES.Auth,
        status: "failure",
        summary: `Mot de passe incorrect pour ${email}`,
        metadata: { reason: "bad-password" },
        request,
      });
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }

    // Subscription gate: apiculteurs can only sign in when their
    // subscription is active. Super-admins and admins are unrestricted.
    if (user.role === "apiculteur") {
      const access = await checkApiculteurAccess(user.email);
      if (!access.ok) {
        await logAudit({
          actor: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          },
          action: AUDIT_ACTIONS.AuthLoginFailed,
          entity: AUDIT_ENTITIES.Auth,
          status: "failure",
          summary: `Accès refusé pour ${email} — abonnement ${access.reason}`,
          metadata: {
            reason: `subscription-${access.reason}`,
            subscriptionStatus: access.status,
          },
          request,
        });
        return NextResponse.json(
          { error: access.message, reason: access.reason },
          { status: 403 }
        );
      }
    }

    const token = await writeSessionCookie(user._id.toString());

    // Best-effort: record the login time so the dashboard "Admins connectés"
    // panel can sort by recent activity, and stamp `lastActiveAt` so the
    // user shows up as online without waiting for the first heartbeat.
    const loginAt = new Date();
    User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: loginAt, lastActiveAt: loginAt } }
    ).catch(() => {});

    const plain = user.toObject();
    const sessionUser = toSessionUser(plain);

    await logAudit({
      actor: sessionUser,
      action: AUDIT_ACTIONS.AuthLogin,
      entity: AUDIT_ENTITIES.Auth,
      entityId: sessionUser.id,
      summary: `${sessionUser.name} s'est connecté`,
      request,
    });

    return NextResponse.json({ user: sessionUser, token });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
