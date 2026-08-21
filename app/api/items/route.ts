import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Item } from "@/models/Item";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/log";

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Item.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Field 'name' is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const item = await Item.create({
      name: body.name,
      description: body.description ?? "",
      completed: Boolean(body.completed),
    });

    await logAudit({
      actor,
      action: AUDIT_ACTIONS.ItemCreate,
      entity: AUDIT_ENTITIES.Item,
      entityId: item._id.toString(),
      summary: `${actor.name} a créé l'élément « ${item.name} »`,
      metadata: { name: item.name },
      request,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/items error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
