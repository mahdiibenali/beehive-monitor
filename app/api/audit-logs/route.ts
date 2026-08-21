import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";

/**
 * GET /api/audit-logs
 *
 * Query params (all optional):
 *   • `page`      — 1-based page number (default 1)
 *   • `pageSize`  — 1..200 (default 50)
 *   • `search`    — free-text match on summary / actor name / actor email
 *   • `action`    — exact action string (e.g. `item.create`)
 *   • `entity`    — entity namespace (`auth` / `user` / `item` / `apiculteur` / `maintenance`)
 *   • `notEntity` — exclude this entity (e.g. `notEntity=auth` to hide connection events)
 *   • `entityId`  — target entity id
 *   • `actorId`   — actor user id
 *   • `status`    — `success` | `failure`
 *   • `from`      — ISO date — only entries on/after this date
 *   • `to`        — ISO date — only entries on/before this date
 *
 * Returns: `{ items, total, page, pageSize, facets: { entities, actions } }`.
 * Super-admin only.
 */
export const dynamic = "force-dynamic";

interface AuditLogDTO {
  id: string;
  actor: {
    id: string | null;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  status: "success" | "failure";
  changes: { field: string; before: unknown; after: unknown }[];
  metadata: Record<string, unknown>;
  ip: string;
  userAgent: string;
  createdAt: string;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "audit.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize") ?? "50") || 50)
  );

  const filter: Record<string, unknown> = {};
  const action = searchParams.get("action");
  const entity = searchParams.get("entity");
  const notEntity = searchParams.get("notEntity");
  const entityId = searchParams.get("entityId");
  const actorId = searchParams.get("actorId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = (searchParams.get("search") ?? "").trim();

  if (action) filter.action = action;
  if (entity) {
    filter.entity = entity;
  } else if (notEntity) {
    filter.entity = { $ne: notEntity };
  }
  if (entityId) filter.entityId = entityId;
  if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
    filter["actor.id"] = new mongoose.Types.ObjectId(actorId);
  }
  if (status === "success" || status === "failure") filter.status = status;

  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) range.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) range.$lte = d;
    }
    if (Object.keys(range).length > 0) filter.createdAt = range;
  }

  if (search.length > 0) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { summary: rx },
      { "actor.name": rx },
      { "actor.email": rx },
      { entityId: rx },
    ];
  }

  try {
    await connectToDatabase();

    // For the status counters we want the totals *without* the status filter
    // itself applied (so toggling Success/Failure doesn't make the other
    // counter freeze at zero).
    const baseFilter = { ...filter };
    delete (baseFilter as Record<string, unknown>).status;

    const [items, total, entityFacet, actionFacet, statusAgg] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      AuditLog.countDocuments(filter),
      // Facets — based on the *unfiltered* collection so the dropdown
      // never empties itself out as the user narrows the search.
      AuditLog.distinct("entity"),
      AuditLog.distinct("action"),
      AuditLog.aggregate<{ _id: string; count: number }>([
        { $match: baseFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = { success: 0, failure: 0 };
    for (const row of statusAgg) {
      if (row._id === "success" || row._id === "failure") {
        statusCounts[row._id] = row.count;
      }
    }

    const dtos: AuditLogDTO[] = items.map((it) => ({
      id: it._id.toString(),
      actor: {
        id: it.actor?.id ? it.actor.id.toString() : null,
        name: it.actor?.name ?? "",
        email: it.actor?.email ?? "",
        role: it.actor?.role ?? "",
      },
      action: it.action ?? "",
      entity: it.entity ?? "",
      entityId: it.entityId ?? null,
      summary: it.summary ?? "",
      status: (it.status as "success" | "failure") ?? "success",
      changes: Array.isArray(it.changes)
        ? it.changes.map((c) => ({
            field: c.field,
            before: c.before,
            after: c.after,
          }))
        : [],
      metadata:
        it.metadata && typeof it.metadata === "object"
          ? (it.metadata as Record<string, unknown>)
          : {},
      ip: it.ip ?? "",
      userAgent: it.userAgent ?? "",
      createdAt: (it.createdAt ?? new Date()).toISOString(),
    }));

    return NextResponse.json({
      items: dtos,
      total,
      page,
      pageSize,
      facets: {
        entities: (entityFacet as string[]).filter(Boolean).sort(),
        actions: (actionFacet as string[]).filter(Boolean).sort(),
      },
      statusCounts,
    });
  } catch (error) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
