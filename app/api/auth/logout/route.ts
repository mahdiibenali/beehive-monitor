import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/log";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

/**
 * POST /api/auth/logout
 * Clears the session cookie. We capture the actor BEFORE clearing the cookie
 * so the audit log records who logged out.
 */
export async function POST(request: NextRequest) {
  const actor = await getCurrentUser();
  await clearSessionCookie();

  if (actor) {
    // Drop presence immediately so the user shows offline on the dashboard
    // without waiting for the heartbeat window to expire.
    try {
      await connectToDatabase();
      await User.updateOne(
        { _id: actor.id },
        { $set: { lastActiveAt: null } }
      );
    } catch {
      // Presence is best-effort — never block the logout response.
    }

    await logAudit({
      actor,
      action: AUDIT_ACTIONS.AuthLogout,
      entity: AUDIT_ENTITIES.Auth,
      entityId: actor.id,
      summary: `${actor.name} s'est déconnecté`,
      request,
    });
  }

  return NextResponse.json({ ok: true });
}
