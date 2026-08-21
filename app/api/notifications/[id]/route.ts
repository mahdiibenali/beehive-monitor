import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth/current-user";
import { buildVisibilityFilter } from "@/lib/notifications/visibility";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * PATCH /api/notifications/[id]
 * Body: { read: true }
 *
 * Marks a single notification as read (for the current user). The user
 * must be a valid recipient (direct or via role broadcast); otherwise we
 * return 404 to avoid leaking the existence of other users' messages.
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

  let body: { read?: unknown };
  try {
    body = (await request.json()) as { read?: unknown };
  } catch {
    body = {};
  }
  if (body?.read !== true) {
    return NextResponse.json(
      { error: "Only { read: true } is supported." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const viewerId = new mongoose.Types.ObjectId(session.id);
    const result = await Notification.updateOne(
      {
        _id: id,
        ...buildVisibilityFilter({
          id: session.id,
          role: session.role,
          joinedAt: session.joinedAt,
        }),
      },
      { $addToSet: { readBy: viewerId } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
