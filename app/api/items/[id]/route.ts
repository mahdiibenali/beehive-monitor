import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Item } from "@/models/Item";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  logAudit,
  diffFields,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
} from "@/lib/audit/log";

type RouteContext = { params: Promise<{ id: string }> };

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const item = await Item.findById(id).lean();
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    console.error("GET /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name === "string") update.name = body.name;
    if (typeof body.description === "string")
      update.description = body.description;
    if (typeof body.completed === "boolean") update.completed = body.completed;

    await connectToDatabase();
    const before = await Item.findById(id).lean();
    if (!before) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await Item.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const changes = diffFields(
      {
        name: before.name,
        description: before.description ?? "",
        completed: before.completed ?? false,
      },
      {
        name: typeof update.name === "string" ? update.name : undefined,
        description:
          typeof update.description === "string" ? update.description : undefined,
        completed:
          typeof update.completed === "boolean" ? update.completed : undefined,
      },
      ["name", "description", "completed"]
    );

    if (changes.length > 0) {
      await logAudit({
        actor,
        action: AUDIT_ACTIONS.ItemUpdate,
        entity: AUDIT_ENTITIES.Item,
        entityId: id,
        summary: `${actor.name} a modifié l'élément « ${before.name} »`,
        changes,
        request,
      });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PATCH /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const result = await Item.findByIdAndDelete(id).lean();
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await logAudit({
      actor,
      action: AUDIT_ACTIONS.ItemDelete,
      entity: AUDIT_ENTITIES.Item,
      entityId: id,
      summary: `${actor.name} a supprimé l'élément « ${result.name} »`,
      metadata: { snapshot: result },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
