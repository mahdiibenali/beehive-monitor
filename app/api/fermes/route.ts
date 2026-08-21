import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { findApiculteurForSession } from "@/lib/apiculteurs/resolve-by-session";
import { sanitizeFermes } from "@/lib/apiculteurs/sanitize";
import { toFermeListItem } from "@/lib/fermes/serializer";
import { totalsFromFermes } from "@/lib/fermes/stats";

export const dynamic = "force-dynamic";

/**
 * GET /api/fermes
 *
 * Paginated list of fermes for the signed-in apiculteur.
 *
 * Query: page, pageSize, status (all|alerte|normale), region, search, sortBy, sortDir
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "hives.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "9") || 9)
  );
  const status = (searchParams.get("status") ?? "all").toLowerCase();
  const region = (searchParams.get("region") ?? "").trim();
  const country = (searchParams.get("country") ?? "").trim();
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();
  const sortBy = searchParams.get("sortBy") === "localisation" ? "localisation" : "nom";
  const sortDir = searchParams.get("sortDir") === "desc" ? -1 : 1;

  try {
    await connectToDatabase();
    const apiculteur = await findApiculteurForSession(session);
    if (!apiculteur) {
      return NextResponse.json(
        { error: "Profil apiculteur introuvable." },
        { status: 404 }
      );
    }

    const apiculteurRegion = apiculteur.region ?? "";
    let items = (apiculteur.fermes ?? []).map((f) =>
      toFermeListItem(f, apiculteurRegion)
    );

    if (status === "alerte" || status === "normale") {
      items = items.filter((r) => r.status === status);
    }
    if (region) {
      items = items.filter(
        (r) => r.region.toLowerCase() === region.toLowerCase()
      );
    }
    if (country) {
      items = items.filter(
        (r) => r.pays.toLowerCase() === country.toLowerCase()
      );
    }
    if (search) {
      items = items.filter(
        (r) =>
          r.nom.toLowerCase().includes(search) ||
          r.region.toLowerCase().includes(search) ||
          r.pays.toLowerCase().includes(search) ||
          r.address.toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => {
      const cmp =
        sortBy === "localisation"
          ? `${a.region} ${a.pays}`.localeCompare(`${b.region} ${b.pays}`)
          : a.nom.localeCompare(b.nom);
      return cmp * sortDir;
    });

    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    const allRows = (apiculteur.fermes ?? []).map((f) =>
      toFermeListItem(f, apiculteurRegion)
    );
    const totalAttention = allRows.reduce(
      (sum, r) => sum + r.ruchesAttention,
      0
    );

    return NextResponse.json({
      items: pageItems,
      total,
      totalAll: allRows.length,
      totalAttention,
      page,
      pageSize,
      apiculteurId: apiculteur._id.toString(),
    });
  } catch (error) {
    console.error("GET /api/fermes error:", error);
    return NextResponse.json(
      { error: "Impossible de charger les fermes." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fermes — add a ferme to the signed-in apiculteur.
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "hives.update.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cleaned = sanitizeFermes([body]);
  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: "Le nom de la ferme est requis." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const apiculteur = await findApiculteurForSession(session);
    if (!apiculteur) {
      return NextResponse.json(
        { error: "Profil apiculteur introuvable." },
        { status: 404 }
      );
    }

    const doc = await Apiculteur.findById(apiculteur._id);
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    doc.fermes.push(cleaned[0]);
    const totals = totalsFromFermes(
      doc.fermes.map((f) => ({
        name: f.name,
        rucheCount: f.rucheCount ?? 0,
        address: f.address ?? "",
        plusCode: f.plusCode ?? "",
        lat: f.lat ?? null,
        lng: f.lng ?? null,
        gatewayCount: f.gatewayCount ?? 1,
        ruchesAttention: f.ruchesAttention ?? 0,
      }))
    );
    doc.fermeCount = totals.fermeCount;
    doc.rucheCount = totals.rucheCount;

    if (!doc.userId && session.id) {
      doc.userId = new mongoose.Types.ObjectId(session.id);
    }

    await doc.save();

    const created = doc.fermes[doc.fermes.length - 1];
    const item = toFermeListItem(created, doc.region ?? "");

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/fermes error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
