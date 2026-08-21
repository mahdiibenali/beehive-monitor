import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/heartbeat
 *
 * Lightweight presence ping. Called by the client every
 * `HEARTBEAT_INTERVAL_MS` (45s by default) while the user has the
 * application open. Updates `User.lastActiveAt` to now so the dashboard
 * can derive who is currently online without keeping any in-memory
 * connection state.
 *
 * Returns `{ ok: true, lastActiveAt }` on success and a 401 if the
 * session is missing — the client treats 401 as a hint to redirect
 * to /login, but otherwise ignores failures (the next beat will retry).
 */
export async function POST() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const now = new Date();
    await User.updateOne({ _id: session.id }, { $set: { lastActiveAt: now } });
    return NextResponse.json({ ok: true, lastActiveAt: now.toISOString() });
  } catch (error) {
    console.error("POST /api/auth/heartbeat error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
