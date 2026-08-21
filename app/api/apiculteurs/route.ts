import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { hashPassword } from "@/lib/auth/password";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/log";
import { pushNotifications } from "@/lib/notifications/server";
import { toApiculteurListItem } from "@/lib/apiculteurs/serializer";
import { sanitizeFermes } from "@/lib/apiculteurs/sanitize";
import { addMonths } from "@/lib/apiculteurs/subscription";
import { isValidAvatarSrc } from "@/lib/image";

export const dynamic = "force-dynamic";

type Status = "active" | "expired" | "suspended";

function dayRange(iso: string) {
  const d = new Date(iso);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * GET /api/apiculteurs
 *
 * Query params:
 *   • page, pageSize          (default 1 / 9)
 *   • status   = all | active | expired | suspended
 *   • search   = matches name, email or phone (case-insensitive)
 *   • sortBy   = name | createdAt | subscriptionEndsAt | rucheCount
 *   • sortDir  = asc | desc
 *   • dateType = est | est-entre | avant | apres   (filters subscriptionEndsAt)
 *   • date     = ISO
 *   • dateFrom / dateTo = ISO
 *
 * Returns the paginated rows, dashboard counters and full map points list
 * (so the right-side map can show every apiculteur, not just the page).
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "apiculteurs.read")) {
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
    sortByParam === "name" ||
    sortByParam === "subscriptionEndsAt" ||
    sortByParam === "rucheCount"
      ? sortByParam
      : "createdAt";
  const sortDir = searchParams.get("sortDir") === "asc" ? 1 : -1;

  const filter: Record<string, unknown> = {};
  if (status === "active") filter.subscriptionStatus = "active";
  else if (status === "expired") filter.subscriptionStatus = "expired";
  else if (status === "suspended") filter.subscriptionStatus = "suspended";

  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const dateType = searchParams.get("dateType");
  const date = searchParams.get("date");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  if (dateType === "est" && date) {
    const { start, end } = dayRange(date);
    filter.subscriptionEndsAt = { $gte: start, $lt: end };
  } else if (dateType === "avant" && date) {
    filter.subscriptionEndsAt = { $lt: dayRange(date).start };
  } else if (dateType === "apres" && date) {
    filter.subscriptionEndsAt = { $gte: dayRange(date).end };
  } else if (dateType === "est-entre" && dateFrom && dateTo) {
    filter.subscriptionEndsAt = {
      $gte: dayRange(dateFrom).start,
      $lt: dayRange(dateTo).end,
    };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    await connectToDatabase();

    // Lazy auto-expiry: any "active" row whose endsAt is past gets flipped
    // to "expired" before we read the page. This keeps counters honest
    // without needing a cron job.
    await Apiculteur.updateMany(
      {
        subscriptionStatus: "active",
        subscriptionEndsAt: { $ne: null, $lt: now },
      },
      { $set: { subscriptionStatus: "expired" } }
    );

    const [
      items,
      total,
      totalAll,
      totalActive,
      totalExpired,
      totalSuspended,
      ruchesAgg,
      fermesAgg,
      monthlyApiculteurs,
      monthlyActiveSubs,
      mapPoints,
    ] = await Promise.all([
      Apiculteur.find(filter)
        .sort({ [sortBy]: sortDir })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Apiculteur.countDocuments(filter),
      Apiculteur.countDocuments({}),
      Apiculteur.countDocuments({ subscriptionStatus: "active" }),
      Apiculteur.countDocuments({ subscriptionStatus: "expired" }),
      Apiculteur.countDocuments({ subscriptionStatus: "suspended" }),
      Apiculteur.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: "$rucheCount" } } },
        { $project: { _id: 0, total: 1 } },
      ]),
      Apiculteur.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: "$fermeCount" } } },
        { $project: { _id: 0, total: 1 } },
      ]),
      Apiculteur.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Apiculteur.countDocuments({
        subscriptionStatus: "active",
        createdAt: { $gte: startOfMonth },
      }),
      Apiculteur.find(
        { lat: { $ne: null }, lng: { $ne: null } },
        { lat: 1, lng: 1, subscriptionStatus: 1, name: 1 }
      )
        .limit(500)
        .lean(),
    ]);

    return NextResponse.json({
      items: items.map(toApiculteurListItem),
      total,
      totalAll,
      totalActive,
      totalExpired,
      totalSuspended,
      totalRuches: ruchesAgg[0]?.total ?? 0,
      totalFermes: fermesAgg[0]?.total ?? 0,
      monthly: {
        apiculteurs: monthlyApiculteurs,
        activeSubscriptions: monthlyActiveSubs,
      },
      mapPoints: mapPoints.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        status: p.subscriptionStatus,
      })),
      page,
      pageSize,
    });
  } catch (error) {
    console.error("GET /api/apiculteurs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch apiculteurs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/apiculteurs
 * Body: { name, email, phone?, region?, rucheCount?, fermeCount?,
 *         subscriptionStatus?, subscriptionEndsAt?, lat?, lng?, avatarSrc? }
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "apiculteurs.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const region = typeof body.region === "string" ? body.region.trim() : "";
  const gender: "male" | "female" | "unknown" =
    body.gender === "male" || body.gender === "female" ? body.gender : "unknown";
  const rucheCount =
    typeof body.rucheCount === "number" && body.rucheCount >= 0
      ? Math.floor(body.rucheCount)
      : 0;
  const fermeCount =
    typeof body.fermeCount === "number" && body.fermeCount >= 0
      ? Math.floor(body.fermeCount)
      : 0;
  const subscriptionStatus: Status =
    body.subscriptionStatus === "active" ||
    body.subscriptionStatus === "expired" ||
    body.subscriptionStatus === "suspended"
      ? body.subscriptionStatus
      : "active";
  const subscriptionPeriodMonths =
    typeof body.subscriptionPeriodMonths === "number" &&
    body.subscriptionPeriodMonths >= 1
      ? Math.min(60, Math.floor(body.subscriptionPeriodMonths))
      : 1;
  // The end date is derived from "now + period" unless the caller
  // provides an explicit override (kept for backwards compatibility).
  const now = new Date();
  const subscriptionStartedAt = now;
  const explicitEndsAt =
    typeof body.subscriptionEndsAt === "string" && body.subscriptionEndsAt
      ? new Date(body.subscriptionEndsAt)
      : null;
  const subscriptionEndsAt =
    explicitEndsAt ?? addMonths(subscriptionStartedAt, subscriptionPeriodMonths);
  // If the apiculteur is created already-suspended, snapshot the full
  // period as remaining time so re-activation grants the full cycle.
  const subscriptionSuspendedAt =
    subscriptionStatus === "suspended" ? now : null;
  const subscriptionRemainingMs =
    subscriptionStatus === "suspended"
      ? Math.max(0, subscriptionEndsAt.getTime() - now.getTime())
      : 0;
  const lat =
    typeof body.lat === "number" && Number.isFinite(body.lat) ? body.lat : null;
  const lng =
    typeof body.lng === "number" && Number.isFinite(body.lng) ? body.lng : null;
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const avatarSrc =
    body.avatarSrc === undefined
      ? ""
      : typeof body.avatarSrc === "string"
      ? body.avatarSrc
      : null;
  const fermes = sanitizeFermes(body.fermes);
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      {
        error:
          "Mot de passe requis (au moins 8 caractères) pour créer le compte de connexion.",
      },
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

    const existing = await Apiculteur.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "Un apiculteur avec cet email existe déjà." },
        { status: 409 }
      );
    }
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà." },
        { status: 409 }
      );
    }

    // Create the login account first; if Apiculteur creation fails we
    // roll back so we never leave a dangling User without a profile.
    const passwordHash = await hashPassword(password);
    const userDoc = await User.create({
      name,
      email,
      phone,
      region,
      role: "apiculteur",
      avatarSrc: avatarSrc || "",
      passwordHash,
      isActive: true,
    });

    let doc;
    try {
      doc = await Apiculteur.create({
        name,
        email,
        phone,
        region,
        gender,
        address,
        rucheCount,
        fermeCount: fermes.length > 0 ? fermes.length : fermeCount,
        subscriptionStatus,
        subscriptionPeriodMonths,
        subscriptionStartedAt,
        subscriptionEndsAt,
        subscriptionSuspendedAt,
        subscriptionRemainingMs,
        lat,
        lng,
        avatarSrc: avatarSrc || "",
        fermes,
        userId: userDoc._id,
      });
    } catch (apicErr) {
      // Roll back the orphaned User account.
      await User.deleteOne({ _id: userDoc._id }).catch(() => {});
      throw apicErr;
    }

    await logAudit({
      actor: session,
      action: AUDIT_ACTIONS.ApiculteurCreate,
      entity: AUDIT_ENTITIES.Apiculteur,
      entityId: doc._id.toString(),
      summary: `${session.name} a ajouté l'apiculteur ${name}`,
      metadata: {
        email,
        phone,
        region,
        rucheCount,
        fermeCount,
        subscriptionStatus,
      },
      request,
    });

    // Notify super-admins (everyone managing the platform) and welcome
    // the new apiculteur in their personal feed.
    await pushNotifications([
      {
        target: { role: "super-admin" },
        message: `${session.name} a ajouté l'apiculteur ${name}.`,
        type: "success",
        action: AUDIT_ACTIONS.ApiculteurCreate,
        entity: AUDIT_ENTITIES.Apiculteur,
        entityId: doc._id.toString(),
        actor: { id: session.id, name: session.name, role: session.role },
      },
      {
        target: { userId: userDoc._id },
        title: "Bienvenue sur Nahoul",
        message:
          "Votre compte apiculteur a été créé. Vous pouvez maintenant vous connecter.",
        type: "success",
        action: "apiculteur.welcome",
        entity: AUDIT_ENTITIES.Apiculteur,
        entityId: doc._id.toString(),
        actor: { id: session.id, name: session.name, role: session.role },
      },
    ]);

    return NextResponse.json(
      { item: toApiculteurListItem(doc) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/apiculteurs error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
