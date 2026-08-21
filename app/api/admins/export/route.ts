import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/admins/export
 * Returns a CSV with every admin row (respecting `?status=` filter).
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
  const status = (searchParams.get("status") ?? "all").toLowerCase();
  const filter: Record<string, unknown> = { role: "admin" };
  if (status === "active") filter.isActive = true;
  else if (status === "disabled") filter.isActive = false;

  try {
    await connectToDatabase();
    const rows = await User.find(filter).sort({ createdAt: -1 }).lean();

    const header = ["Nom", "Email", "Téléphone", "Statut", "Date de création"];
    const lines = [header.join(",")];

    for (const r of rows) {
      const date = (r.createdAt ?? new Date()).toLocaleDateString("fr-FR");
      const cells = [
        r.name,
        r.email,
        r.phone ?? "",
        r.isActive ? "Active" : "Désactivé",
        date,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }

    const csv = "\ufeff" + lines.join("\n"); // UTF-8 BOM for Excel
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="admins-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admins/export error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
