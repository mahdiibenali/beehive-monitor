import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/log";
import { pushNotifications } from "@/lib/notifications/server";
import { toAdminListItem } from "@/lib/admins/serializer";
import { isValidAvatarSrc } from "@/lib/image";

export const dynamic = "force-dynamic";

/**
 * GET /api/admins
 *
 * Query params:
 *   • page, pageSize          (default 1 / 9)
 *   • status   = all | active | disabled
 *   • search   = matches name or email (case-insensitive)
 *   • sortBy   = name | createdAt
 *   • sortDir  = asc | desc
 *   • dateType = est | est-entre | avant | apres
 *   • date     = ISO  (for est / avant / apres)
 *   • dateFrom = ISO  (for est-entre)
 *   • dateTo   = ISO  (for est-entre)
 *
 * Returns `{ items, total, totalAll, totalActive, page, pageSize }`.
 * Super-admin only.
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "admins.read")) {
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
  const sortBy = searchParams.get("sortBy") === "name" ? "name" : "createdAt";
  const sortDir = searchParams.get("sortDir") === "asc" ? 1 : -1;

  const filter: Record<string, unknown> = { role: "admin" };

  if (status === "active") filter.isActive = true;
  else if (status === "disabled") filter.isActive = false;

  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  // Date filter on createdAt
  const dateType = searchParams.get("dateType");
  const date = searchParams.get("date");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  function dayRange(iso: string) {
    const d = new Date(iso);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (dateType === "est" && date) {
    const { start, end } = dayRange(date);
    filter.createdAt = { $gte: start, $lt: end };
  } else if (dateType === "avant" && date) {
    filter.createdAt = { $lt: dayRange(date).start };
  } else if (dateType === "apres" && date) {
    filter.createdAt = { $gte: dayRange(date).end };
  } else if (dateType === "est-entre" && dateFrom && dateTo) {
    filter.createdAt = {
      $gte: dayRange(dateFrom).start,
      $lt: dayRange(dateTo).end,
    };
  }

  try {
    await connectToDatabase();
    const [items, total, totalAll, totalActive] = await Promise.all([
      User.find(filter)
        .sort({ [sortBy]: sortDir })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      User.countDocuments(filter),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "admin", isActive: true }),
    ]);

    return NextResponse.json({
      items: items.map(toAdminListItem),
      total,
      totalAll,
      totalActive,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("GET /api/admins error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admins
 * Body: { name, email, phone?, password, isActive? }
 * Super-admin only.
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "admins.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    avatarSrc?: unknown;
    password?: unknown;
    isActive?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const isActive = body.isActive === undefined ? true : Boolean(body.isActive);
  const avatarSrc =
    body.avatarSrc === undefined
      ? ""
      : typeof body.avatarSrc === "string"
      ? body.avatarSrc
      : null;

  if (name.length < 2) {
    return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 6 caractères." },
      { status: 400 }
    );
  }
  if (avatarSrc === null || !isValidAvatarSrc(avatarSrc)) {
    return NextResponse.json(
      { error: "Image invalide ou trop volumineuse." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const doc = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: "admin",
      isActive,
      avatarSrc: avatarSrc || "",
    });

    await logAudit({
      actor: session,
      action: AUDIT_ACTIONS.UserCreate,
      entity: AUDIT_ENTITIES.User,
      entityId: doc._id.toString(),
      summary: `${session.name} a créé l'administrateur ${name}`,
      metadata: {
        role: "admin",
        email,
        phone,
        isActive,
        avatar: avatarSrc ? "set" : "unset",
      },
      request,
    });

    await pushNotifications([
      {
        target: { role: "super-admin" },
        message: `${session.name} a créé l'administrateur ${name}.`,
        type: "success",
        action: AUDIT_ACTIONS.UserCreate,
        entity: AUDIT_ENTITIES.User,
        entityId: doc._id.toString(),
        actor: { id: session.id, name: session.name, role: session.role },
      },
      {
        target: { userId: doc._id },
        title: "Bienvenue sur Nahoul",
        message:
          "Votre compte administrateur a été créé. Vous pouvez maintenant vous connecter.",
        type: "success",
        action: "admin.welcome",
        entity: AUDIT_ENTITIES.User,
        entityId: doc._id.toString(),
        actor: { id: session.id, name: session.name, role: session.role },
      },
    ]);

    return NextResponse.json({ item: toAdminListItem(doc) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admins error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
