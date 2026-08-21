import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth/current-user";
import { buildVisibilityFilter } from "@/lib/notifications/visibility";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/read-all
 *
 * Adds the current user's id to `readBy` on every notification the user
 * can see (direct + role broadcasts). Returns the new unread count
 * (should always be 0).
 */
export async function POST() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const viewerId = new mongoose.Types.ObjectId(session.id);
    const filter = {
      ...buildVisibilityFilter({
        id: session.id,
        role: session.role,
        joinedAt: session.joinedAt,
      }),
      readBy: { $ne: viewerId },
    };
    const result = await Notification.updateMany(filter, {
      $addToSet: { readBy: viewerId },
    });

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount ?? 0,
    });
  } catch (error) {
    console.error("POST /api/notifications/read-all error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
