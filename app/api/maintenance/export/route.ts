import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Maintenance } from "@/models/Maintenance";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/maintenance/export
 * Returns a CSV of every maintenance demand (respecting the `status`
 * filter). Super-admin + admin.
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
  const status = (searchParams.get("status") ?? "all").toLowerCase();
  const filter: Record<string, unknown> = {};
  if (status === "traite") filter.status = "traite";
  else if (status === "non-traite") filter.status = "non-traite";

  try {
    await connectToDatabase();
    const rows = await Maintenance.find(filter).sort({ createdAt: -1 }).lean();

    const header = [
      "Apiculteur",
      "Email",
      "Titre",
      "Statut",
      "Date demande",
      "Échéance",
      "Date traitement",
      "Traité par",
    ];
    const lines = [header.join(",")];

    for (const r of rows) {
      const cells = [
        r.apiculteurSnapshot?.name ?? "",
        r.apiculteurSnapshot?.email ?? "",
        r.title,
        r.status === "traite" ? "Traité" : "Non traité",
        r.startedAt
          ? new Date(r.startedAt).toLocaleDateString("fr-FR")
          : "",
        r.dueAt ? new Date(r.dueAt).toLocaleDateString("fr-FR") : "",
        r.treatedAt
          ? new Date(r.treatedAt).toLocaleDateString("fr-FR")
          : "",
        r.treatedBy?.name ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }

    const csv = "\ufeff" + lines.join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="maintenance-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/maintenance/export error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
