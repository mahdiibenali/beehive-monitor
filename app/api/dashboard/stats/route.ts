import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";
import { User } from "@/models/User";
import { Maintenance } from "@/models/Maintenance";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { isOnline } from "@/lib/auth/presence";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/stats
 *
 * Returns the aggregated counters, regional/gender breakdowns and
 * recent activity feeds used by the super-admin Dashboard.
 *
 * Shape is intentionally flat — the dashboard mostly maps each block
 * to one card so we keep the payload predictable rather than nested.
 */
export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "dashboard.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();

    // -----------------------------------------------------------------
    // Boundary dates (start of current month / previous month) — used
    // for "+X ce mois" delta strings on the top metrics row.
    // -----------------------------------------------------------------
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // -----------------------------------------------------------------
    // Apiculteurs: total count, new this month, sum of ruches.
    // Everything in one $facet so we hit MongoDB only once.
    // -----------------------------------------------------------------
    const [apiculteurFacet] = await Apiculteur.aggregate([
      {
        $facet: {
          total: [{ $count: "n" }],
          newThisMonth: [
            { $match: { createdAt: { $gte: monthStart } } },
            { $count: "n" },
          ],
          rucheTotal: [
            { $group: { _id: null, n: { $sum: "$rucheCount" } } },
          ],
          rucheNewThisMonth: [
            { $match: { createdAt: { $gte: monthStart } } },
            { $group: { _id: null, n: { $sum: "$rucheCount" } } },
          ],
          byRegion: [
            { $match: { region: { $ne: "" } } },
            { $group: { _id: "$region", n: { $sum: 1 } } },
            { $sort: { n: -1 } },
          ],
          byGender: [
            { $group: { _id: "$gender", n: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const pickN = (rows: { n: number }[] | undefined) => rows?.[0]?.n ?? 0;
    const apiculteurTotal = pickN(apiculteurFacet?.total);
    const apiculteurNewThisMonth = pickN(apiculteurFacet?.newThisMonth);
    const rucheTotal = pickN(apiculteurFacet?.rucheTotal);
    const rucheNewThisMonth = pickN(apiculteurFacet?.rucheNewThisMonth);

    const byRegion: { region: string; count: number }[] = (
      apiculteurFacet?.byRegion ?? []
    ).map((row: { _id: string; n: number }) => ({
      region: row._id,
      count: row.n,
    }));

    const genderRows: { _id: string; n: number }[] = apiculteurFacet?.byGender ?? [];
    const byGender = {
      male: genderRows.find((r) => r._id === "male")?.n ?? 0,
      female: genderRows.find((r) => r._id === "female")?.n ?? 0,
      unknown: genderRows.find((r) => r._id === "unknown" || r._id === null)?.n ?? 0,
    };

    // -----------------------------------------------------------------
    // Maintenance: total + recent feed (5 newest).
    // -----------------------------------------------------------------
    const [maintenanceTotal, recentMaintenanceDocs] = await Promise.all([
      Maintenance.countDocuments({}),
      Maintenance.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select({
          _id: 1,
          title: 1,
          status: 1,
          createdAt: 1,
          startedAt: 1,
          dueAt: 1,
          apiculteurSnapshot: 1,
        })
        .lean(),
    ]);

    const recentMaintenance = recentMaintenanceDocs.map((d) => {
      const snap = (d.apiculteurSnapshot ?? {}) as {
        name?: string;
        email?: string;
        avatarSrc?: string;
      };
      return {
        id: d._id.toString(),
        title: d.title ?? "",
        status: d.status ?? "non-traite",
        createdAt: (d.createdAt ?? new Date()).toISOString(),
        startedAt: d.startedAt ? new Date(d.startedAt).toISOString() : null,
        dueAt: d.dueAt ? new Date(d.dueAt).toISOString() : null,
        apiculteur: {
          name: snap.name ?? "",
          email: snap.email ?? "",
          avatarSrc: snap.avatarSrc ?? "",
        },
      };
    });

    // -----------------------------------------------------------------
    // Admins connectés: the 8 most recently active admins. Only fetched
    // (and only returned) for super-admins — regular admins shouldn't
    // see one another's presence info, so we omit the block entirely.
    // -----------------------------------------------------------------
    let connectedAdmins: Array<{
      id: string;
      name: string;
      email: string;
      avatarSrc: string;
      role: string;
      lastLoginAt: string | null;
      lastActiveAt: string | null;
      isOnline: boolean;
    }> = [];
    let onlineAdminsCount = 0;

    if (session.role === "super-admin") {
      const adminDocs = await User.find({
        role: { $in: ["admin", "super-admin"] },
        lastLoginAt: { $ne: null },
        // Never include the viewer in their own "Admins connectés" list.
        _id: { $ne: session.id },
      })
        .sort({ lastActiveAt: -1, lastLoginAt: -1 })
        .limit(8)
        .select({
          _id: 1,
          name: 1,
          email: 1,
          avatarSrc: 1,
          lastLoginAt: 1,
          lastActiveAt: 1,
          role: 1,
        })
        .lean();

      connectedAdmins = adminDocs
        .map((u) => ({
          id: u._id.toString(),
          name: u.name ?? "",
          email: u.email ?? "",
          avatarSrc: u.avatarSrc ?? "",
          role: u.role,
          lastLoginAt: u.lastLoginAt
            ? new Date(u.lastLoginAt).toISOString()
            : null,
          lastActiveAt: u.lastActiveAt
            ? new Date(u.lastActiveAt).toISOString()
            : null,
          isOnline: isOnline(u.lastActiveAt ?? null),
        }))
        // Online users first, then by most-recent activity.
        .sort((a, b) => {
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          const ta = a.lastActiveAt ?? a.lastLoginAt ?? "";
          const tb = b.lastActiveAt ?? b.lastLoginAt ?? "";
          return tb.localeCompare(ta);
        });

      onlineAdminsCount = connectedAdmins.filter((a) => a.isOnline).length;
    }

    return NextResponse.json({
      generatedAt: now.toISOString(),
      apiculteurs: {
        total: apiculteurTotal,
        newThisMonth: apiculteurNewThisMonth,
      },
      ruches: {
        total: rucheTotal,
        newThisMonth: rucheNewThisMonth,
      },
      maintenance: {
        total: maintenanceTotal,
      },
      byRegion,
      byGender,
      recentMaintenance,
      connectedAdmins,
      onlineAdminsCount,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
