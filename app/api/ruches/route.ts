import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { findApiculteurForSession } from "@/lib/apiculteurs/resolve-by-session";
import { toRucheListItem } from "@/lib/ruches/serializer";

export const dynamic = "force-dynamic";

/**
 * GET /api/ruches
 *
 * Paginated list of every ruche across the signed-in apiculteur's fermes.
 *
 * Query: page, pageSize, status (all|alerte|normale), region, search,
 *        fermeId, sortBy (nom|ferme|localisation), sortDir.
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
    200,
    Math.max(1, Number(searchParams.get("pageSize") ?? "12") || 12)
  );
  const status = (searchParams.get("status") ?? "all").toLowerCase();
  const region = (searchParams.get("region") ?? "").trim();
  const fermeId = (searchParams.get("fermeId") ?? "").trim();
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();
  const sortByRaw = searchParams.get("sortBy") ?? "nom";
  const sortBy =
    sortByRaw === "ferme" || sortByRaw === "localisation" ? sortByRaw : "nom";
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

    // Flatten every ruche from every ferme of the apiculteur.
    let items = (apiculteur.fermes ?? []).flatMap((f) =>
      (f.ruches ?? []).map((r) => toRucheListItem(r, f, apiculteurRegion))
    );

    if (status === "alerte" || status === "normale") {
      items = items.filter((r) => r.status === status);
    }
    if (region) {
      items = items.filter(
        (r) => r.region.toLowerCase() === region.toLowerCase()
      );
    }
    if (fermeId) {
      items = items.filter((r) => r.fermeId === fermeId);
    }
    if (search) {
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.fermeName.toLowerCase().includes(search) ||
          r.region.toLowerCase().includes(search) ||
          r.gatewayLabel.toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => {
      const cmp =
        sortBy === "ferme"
          ? a.fermeName.localeCompare(b.fermeName)
          : sortBy === "localisation"
          ? `${a.region} ${a.pays}`.localeCompare(`${b.region} ${b.pays}`)
          : a.name.localeCompare(b.name, "fr", { numeric: true });
      return cmp * sortDir;
    });

    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    // Counts on the unfiltered list so the header stays stable across filters.
    const allRows = (apiculteur.fermes ?? []).flatMap((f) =>
      (f.ruches ?? []).map((r) => toRucheListItem(r, f, apiculteurRegion))
    );
    const totalAttention = allRows.filter((r) => r.status === "alerte").length;

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
    console.error("GET /api/ruches error:", error);
    return NextResponse.json(
      { error: "Impossible de charger les ruches." },
      { status: 500 }
    );
  }
}
