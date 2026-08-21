import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Maintenance } from "@/models/Maintenance";
import { Apiculteur } from "@/models/Apiculteur";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/log";
import { pushNotification, pushNotifications } from "@/lib/notifications/server";
import { toMaintenanceListItem } from "@/lib/maintenance/serializer";
import { resolveApiculteurLive } from "@/lib/maintenance/resolve-user-id";

export const dynamic = "force-dynamic";

function dayRange(iso: string) {
  const d = new Date(iso);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * GET /api/maintenance
 *
 * Paginated list of maintenance demands, optionally filtered.
 *
 * Query params (all optional):
 *   • `page`, `pageSize`        (defaults: 1 / 9)
 *   • `status`   = all | traite | non-traite
 *   • `search`   = matches apiculteur name / email / title (case-insensitive)
 *   • `sortBy`   = createdAt | startedAt | title
 *   • `sortDir`  = asc | desc
 *   • `dateType` = est | est-entre | avant | apres   (filters startedAt)
 *   • `date`     = ISO  (for est / avant / apres)
 *   • `dateFrom` = ISO  (for est-entre)
 *   • `dateTo`   = ISO  (for est-entre)
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "maintenance.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "9") || 9)
  );
  const status = (searchParams.get("status") ?? "all").toLowerCase();
  const search = (searchParams.get("search") ?? "").trim();
  const sortByParam = searchParams.get("sortBy") ?? "createdAt";
  const sortBy =
    sortByParam === "startedAt" || sortByParam === "title"
      ? sortByParam
      : "createdAt";
  const sortDir = searchParams.get("sortDir") === "asc" ? 1 : -1;

  const filter: Record<string, unknown> = {};
  if (status === "traite") filter.status = "traite";
  else if (status === "non-traite") filter.status = "non-traite";

  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    filter.$or = [
      { "apiculteurSnapshot.name": rx },
      { "apiculteurSnapshot.email": rx },
      { title: rx },
    ];
  }

  const dateType = searchParams.get("dateType");
  const date = searchParams.get("date");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  if (dateType === "est" && date) {
    const { start, end } = dayRange(date);
    filter.startedAt = { $gte: start, $lt: end };
  } else if (dateType === "avant" && date) {
    filter.startedAt = { $lt: dayRange(date).start };
  } else if (dateType === "apres" && date) {
    filter.startedAt = { $gte: dayRange(date).end };
  } else if (dateType === "est-entre" && dateFrom && dateTo) {
    filter.startedAt = {
      $gte: dayRange(dateFrom).start,
      $lt: dayRange(dateTo).end,
    };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    await connectToDatabase();
    const [items, total, totalAll, totalThisMonth, totalUnresolved, totalApiculteurs] =
      await Promise.all([
        Maintenance.find(filter)
          .sort({ [sortBy]: sortDir })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        Maintenance.countDocuments(filter),
        Maintenance.countDocuments({}),
        Maintenance.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Maintenance.countDocuments({ status: "non-traite" }),
        Apiculteur.countDocuments({}),
      ]);

    // Resolve apiculteurId → userId + live avatar in a single batched
    // query so the list view can open the profile preview without a
    // second roundtrip, and so a stale snapshot avatar is replaced by
    // the apiculteur's current photo.
    const apiculteurIds = items
      .map((it) => it.apiculteurId)
      .filter((v): v is NonNullable<typeof v> => !!v);
    const apiculteurRecords = apiculteurIds.length
      ? await Apiculteur.find({ _id: { $in: apiculteurIds } })
          .select("userId avatarSrc")
          .lean()
      : [];
    const liveByApiculteur = new Map<
      string,
      { userId: string | null; avatarSrc: string }
    >();
    for (const a of apiculteurRecords) {
      liveByApiculteur.set(a._id.toString(), {
        userId: a.userId ? a.userId.toString() : null,
        avatarSrc: a.avatarSrc ?? "",
      });
    }

    return NextResponse.json({
      items: items.map((doc) => {
        const live = doc.apiculteurId
          ? liveByApiculteur.get(doc.apiculteurId.toString())
          : undefined;
        return toMaintenanceListItem(
          doc,
          live?.userId ?? null,
          live?.avatarSrc ?? null
        );
      }),
      total,
      totalAll,
      totalThisMonth,
      totalUnresolved,
      totalApiculteurs,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("GET /api/maintenance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance demands" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maintenance
 *
 * File a new maintenance demand. Used by apiculteurs from the mobile
 * app today, and by admins (e.g. to seed test data). The apiculteur
 * snapshot is computed server-side from the current Apiculteur record
 * so the listing stays consistent.
 *
 * Body:
 *   • `apiculteurId` (required for admins; defaults to the caller's
 *     linked apiculteur record when role === "apiculteur")
 *   • `title`        (required)
 *   • `description`  (optional)
 *   • `startedAt`    (ISO, defaults to now)
 *   • `dueAt`        (ISO, optional)
 *   • `attachmentUrl` (optional)
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  // Admins seed demands for tests; apiculteurs file their own.
  const allowed =
    canDo(session.role, "maintenance.create") ||
    canDo(session.role, "maintenance.update");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const attachmentUrl =
    typeof body.attachmentUrl === "string" ? body.attachmentUrl.trim() : "";
  const startedAt =
    typeof body.startedAt === "string" && body.startedAt
      ? new Date(body.startedAt)
      : new Date();
  const dueAt =
    typeof body.dueAt === "string" && body.dueAt ? new Date(body.dueAt) : null;

  if (title.length < 2) {
    return NextResponse.json(
      { error: "Le titre est requis." },
      { status: 400 }
    );
  }

  let apiculteurId: string | null = null;
  if (typeof body.apiculteurId === "string" && body.apiculteurId) {
    if (!mongoose.Types.ObjectId.isValid(body.apiculteurId)) {
      return NextResponse.json(
        { error: "Identifiant apiculteur invalide." },
        { status: 400 }
      );
    }
    apiculteurId = body.apiculteurId;
  }

  try {
    await connectToDatabase();

    // Resolve the apiculteur snapshot. If the caller is an apiculteur, we
    // look up the matching record by their account email.
    let snap: {
      name: string;
      email: string;
      phone: string;
      avatarSrc: string;
      rucheCount: number;
      fermeCount: number;
      inscriptionAt: Date | null;
    } | null = null;
    /** Linked user-account id of the apiculteur — used to notify them. */
    let apiculteurUserId: string | null = null;

    if (apiculteurId) {
      const a = await Apiculteur.findById(apiculteurId).lean();
      if (a) {
        snap = {
          name: a.name,
          email: a.email,
          phone: a.phone ?? "",
          avatarSrc: a.avatarSrc ?? "",
          rucheCount: a.rucheCount ?? 0,
          fermeCount: a.fermeCount ?? 0,
          inscriptionAt: a.createdAt ?? null,
        };
        apiculteurUserId = a.userId ? a.userId.toString() : null;
      }
    } else if (session.role === "apiculteur") {
      const a = await Apiculteur.findOne({ email: session.email }).lean();
      if (a) {
        apiculteurId = a._id.toString();
        snap = {
          name: a.name,
          email: a.email,
          phone: a.phone ?? "",
          avatarSrc: a.avatarSrc ?? "",
          rucheCount: a.rucheCount ?? 0,
          fermeCount: a.fermeCount ?? 0,
          inscriptionAt: a.createdAt ?? null,
        };
        apiculteurUserId = a.userId ? a.userId.toString() : null;
      }
    }

    if (!snap) {
      return NextResponse.json(
        { error: "Apiculteur introuvable pour cette demande." },
        { status: 400 }
      );
    }

    const doc = await Maintenance.create({
      apiculteurId,
      apiculteurSnapshot: snap,
      title,
      description,
      startedAt,
      dueAt,
      attachmentUrl,
      status: "non-traite",
      lastActivityAt: new Date(),
    });

    await logAudit({
      actor: session,
      action: AUDIT_ACTIONS.MaintenanceCreate,
      entity: AUDIT_ENTITIES.Maintenance,
      entityId: doc._id.toString(),
      summary: `${session.name} a créé la demande "${title}" pour ${snap.name}`,
      metadata: { apiculteurId, title },
      request,
    });

    // Notify every staff member that can act on maintenance (super-admin
    // + admin). Each notification carries the actor; staff members who
    // happen to be the actor have it filtered out client-side by the
    // `actor.id !== viewerId` rule, so nobody sees their own action.
    await pushNotifications([
      {
        target: { role: "super-admin" },
        title: "Nouvelle demande de maintenance",
        message: `${snap.name} — ${title}`,
        type: "info",
        action: AUDIT_ACTIONS.MaintenanceCreate,
        entity: AUDIT_ENTITIES.Maintenance,
        entityId: doc._id.toString(),
        actor: { id: session.id, name: session.name, role: session.role },
      },
      {
        target: { role: "admin" },
        title: "Nouvelle demande de maintenance",
        message: `${snap.name} — ${title}`,
        type: "info",
        action: AUDIT_ACTIONS.MaintenanceCreate,
        entity: AUDIT_ENTITIES.Maintenance,
        entityId: doc._id.toString(),
        actor: { id: session.id, name: session.name, role: session.role },
      },
    ]);

    // If staff created the ticket on behalf of an apiculteur, ping them
    // too so they know a demand was opened in their name.
    if (session.role !== "apiculteur" && apiculteurUserId) {
      await pushNotification({
        target: { userId: apiculteurUserId },
        title: "Nouvelle demande créée",
        message: `${session.name} a ouvert une demande "${title}" en votre nom.`,
        type: "info",
        action: AUDIT_ACTIONS.MaintenanceCreate,
        entity: AUDIT_ENTITIES.Maintenance,
        entityId: doc._id.toString(),
        actor: { id: session.id, name: session.name, role: session.role },
      });
    }

    {
      const live = await resolveApiculteurLive(doc.apiculteurId);
      return NextResponse.json(
        {
          item: toMaintenanceListItem(doc, live.userId, live.avatarSrc),
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("POST /api/maintenance error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
