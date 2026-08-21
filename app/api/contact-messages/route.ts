import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/log";
import { pushNotifications } from "@/lib/notifications/server";
import { toContactMessageListItem } from "@/lib/contact/serializer";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractClientMeta(req: NextRequest) {
  const ipHeader =
    req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";
  const ip = ipHeader.split(",")[0]?.trim() ?? "";
  const userAgent = req.headers.get("user-agent") ?? "";
  return { ip, userAgent };
}

/**
 * POST /api/contact-messages
 *
 * Public endpoint — used by the `/contact` form. No auth required.
 * Validates input, persists the message, audit-logs the submission and
 * notifies super-admins + admins so they see it in their bell + inbox.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  if (firstName.length < 1 || firstName.length > 80) {
    return NextResponse.json(
      { error: "Le prénom est requis." },
      { status: 400 }
    );
  }
  if (lastName.length < 1 || lastName.length > 80) {
    return NextResponse.json(
      { error: "Le nom est requis." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json(
      { error: "Email invalide." },
      { status: 400 }
    );
  }
  if (message.length < 3 || message.length > 4000) {
    return NextResponse.json(
      { error: "Le message doit faire entre 3 et 4000 caractères." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const { ip, userAgent } = extractClientMeta(request);

    const doc = await ContactMessage.create({
      firstName,
      lastName,
      email,
      message,
      status: "new",
      ip,
      userAgent,
    });

    const fullName = `${firstName} ${lastName}`.trim();

    // Audit. The actor is anonymous because the form is public; the
    // submitter's email/name still ends up in the entry metadata so the
    // log is useful when triaging spam waves.
    await logAudit({
      actor: { name: fullName, email, role: "guest" },
      action: AUDIT_ACTIONS.ContactMessageCreate,
      entity: AUDIT_ENTITIES.ContactMessage,
      entityId: doc._id.toString(),
      summary: `${fullName} a envoyé un message via le formulaire de contact`,
      metadata: { email },
      request,
    });

    // Ping every super-admin + admin. We don't link to a hardcoded path
    // here — `entity` + `entityId` are enough for the notification router
    // to deep-link to `/messages-contact?open=<id>`.
    await pushNotifications([
      {
        target: { role: "super-admin" },
        title: "Nouveau message de contact",
        message: `${fullName} — ${message.slice(0, 80)}${
          message.length > 80 ? "…" : ""
        }`,
        type: "info",
        action: AUDIT_ACTIONS.ContactMessageCreate,
        entity: AUDIT_ENTITIES.ContactMessage,
        entityId: doc._id.toString(),
        actor: { id: null, name: fullName, role: "guest" },
      },
      {
        target: { role: "admin" },
        title: "Nouveau message de contact",
        message: `${fullName} — ${message.slice(0, 80)}${
          message.length > 80 ? "…" : ""
        }`,
        type: "info",
        action: AUDIT_ACTIONS.ContactMessageCreate,
        entity: AUDIT_ENTITIES.ContactMessage,
        entityId: doc._id.toString(),
        actor: { id: null, name: fullName, role: "guest" },
      },
    ]);

    return NextResponse.json(
      { item: toContactMessageListItem(doc.toObject()) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/contact-messages error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contact-messages
 *
 * Admin endpoint — paginated list of submitted messages.
 *
 * Query params (all optional):
 *   • `page`, `pageSize`  (defaults: 1 / 12)
 *   • `status` = all | new | read | handled
 *   • `search` = matches name / email / message body (case-insensitive)
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "contact-messages.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "12") || 12)
  );
  const status = (searchParams.get("status") ?? "all").toLowerCase();
  const search = (searchParams.get("search") ?? "").trim();

  const filter: Record<string, unknown> = {};
  if (status === "new" || status === "read" || status === "handled") {
    filter.status = status;
  }

  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    filter.$or = [
      { firstName: rx },
      { lastName: rx },
      { email: rx },
      { message: rx },
    ];
  }

  try {
    await connectToDatabase();
    const [items, total, totalNew, totalRead, totalHandled, totalAll] =
      await Promise.all([
        ContactMessage.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        ContactMessage.countDocuments(filter),
        ContactMessage.countDocuments({ status: "new" }),
        ContactMessage.countDocuments({ status: "read" }),
        ContactMessage.countDocuments({ status: "handled" }),
        ContactMessage.countDocuments({}),
      ]);

    return NextResponse.json({
      items: items.map((d) => toContactMessageListItem(d)),
      total,
      totalAll,
      counts: {
        new: totalNew,
        read: totalRead,
        handled: totalHandled,
      },
      page,
      pageSize,
    });
  } catch (error) {
    console.error("GET /api/contact-messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact messages" },
      { status: 500 }
    );
  }
}
