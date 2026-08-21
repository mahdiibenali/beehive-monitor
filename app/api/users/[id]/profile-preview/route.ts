import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Apiculteur } from "@/models/Apiculteur";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/users/[id]/profile-preview
 *
 * Lightweight, read-only profile snapshot returned to any authenticated
 * user. Used when clicking on a sender's avatar (e.g. in the maintenance
 * reply thread) to display a "who is this?" card.
 *
 * Payload is intentionally narrow:
 *   • id, name, role, email, phone, avatarSrc, region
 *   • for apiculteurs only: ruche / ferme counts and `createdAt` ("Membre depuis")
 *
 * Never returns passwordHash or any internal flag.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(id)
      .select("name email role avatarSrc phone region isActive createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // For apiculteurs, pull the rich apiculteur record so the preview can
    // mirror the management drawer (map + fermes table + ruche / ferme
    // counts). Linked by email since that's our current join key.
    let apiculteurExtras: {
      address?: string;
      region?: string;
      lat?: number | null;
      lng?: number | null;
      rucheCount?: number;
      fermeCount?: number;
      memberSince?: string;
      fermes?: Array<{
        id: string;
        name: string;
        rucheCount: number;
        address: string;
        plusCode: string;
        lat: number | null;
        lng: number | null;
      }>;
    } = {};

    // Apiculteur record is the source of truth for an apiculteur's
    // identity (the management page edits this), so capture its avatar
    // here too in order to override the (sometimes stale) `User.avatarSrc`.
    let apiculteurAvatar: string | null = null;
    if (user.role === "apiculteur" && user.email) {
      const api = await Apiculteur.findOne({ email: user.email })
        .select(
          "rucheCount fermeCount createdAt fermes address region lat lng avatarSrc"
        )
        .lean();
      if (api) {
        apiculteurAvatar = api.avatarSrc ?? null;
        apiculteurExtras = {
          rucheCount: api.rucheCount ?? 0,
          fermeCount: api.fermeCount ?? 0,
          address: api.address ?? "",
          region: api.region ?? user.region ?? "",
          lat: api.lat ?? null,
          lng: api.lng ?? null,
          memberSince: api.createdAt
            ? new Date(api.createdAt).toISOString()
            : undefined,
          fermes: (api.fermes ?? []).map((f) => ({
            id: f._id ? f._id.toString() : "",
            name: f.name ?? "",
            rucheCount: f.rucheCount ?? 0,
            address: f.address ?? "",
            plusCode: f.plusCode ?? "",
            lat: f.lat ?? null,
            lng: f.lng ?? null,
          })),
        };
      }
    }

    // Resolved avatar: prefer the Apiculteur record (canonical for
    // apiculteurs), then fall back to the User record. We also normalise
    // the seed placeholder away so the UI's `?: undefined` check works.
    const resolvedAvatar =
      (apiculteurAvatar && apiculteurAvatar !== "/brand/avatar-sample.svg"
        ? apiculteurAvatar
        : null) ??
      (user.avatarSrc && user.avatarSrc !== "/brand/avatar-sample.svg"
        ? user.avatarSrc
        : "");

    return NextResponse.json({
      profile: {
        id: user._id.toString(),
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role ?? "",
        avatarSrc: resolvedAvatar,
        phone: user.phone ?? "",
        region: apiculteurExtras.region ?? user.region ?? "",
        isActive: user.isActive ?? true,
        memberSince:
          apiculteurExtras.memberSince ??
          (user.createdAt ? new Date(user.createdAt).toISOString() : null),
        rucheCount: apiculteurExtras.rucheCount,
        fermeCount: apiculteurExtras.fermeCount,
        address: apiculteurExtras.address ?? "",
        lat: apiculteurExtras.lat ?? null,
        lng: apiculteurExtras.lng ?? null,
        fermes: apiculteurExtras.fermes ?? [],
      },
    });
  } catch (error) {
    console.error("GET /api/users/[id]/profile-preview error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
