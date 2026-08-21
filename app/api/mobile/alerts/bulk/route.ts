import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/mongodb";
import { canDo } from "@/lib/auth/roles";
import { Alert } from "@/models/Alert";

export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "hives.update.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { action: string; alertIds: string[] };
  try {
    body = (await request.json()) as any;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, alertIds } = body;
  if (!action || !Array.isArray(alertIds)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    
    if (action === "Supprimer") {
      await Alert.deleteMany({ _id: { $in: alertIds }, userId: session.id });
    } else {
      await Alert.updateMany(
        { _id: { $in: alertIds }, userId: session.id },
        { $set: { status: action } }
      );
    }

    return NextResponse.json({ success: true, message: `Updated ${alertIds.length} alerts to ${action}` }, { status: 200 });
  } catch (error) {
    console.error("POST /api/mobile/alerts/bulk error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
