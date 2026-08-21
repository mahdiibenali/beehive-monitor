import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { findApiculteurForSession } from "@/lib/apiculteurs/resolve-by-session";
import { toFermeListItem } from "@/lib/fermes/serializer";
import { totalsFromFermes } from "@/lib/fermes/stats";

export const dynamic = "force-dynamic";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function syncTotals(doc: InstanceType<typeof Apiculteur>) {
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
}

/**
 * GET /api/fermes/[id] — single ferme owned by the signed-in apiculteur.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "hives.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const apiculteur = await findApiculteurForSession(session);
    if (!apiculteur) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ferme = (apiculteur.fermes ?? []).find(
      (f) => f._id?.toString() === id
    );
    if (!ferme) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      item: toFermeListItem(ferme, apiculteur.region ?? ""),
    });
  } catch (error) {
    console.error("GET /api/fermes/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fermes/[id] — update one embedded ferme.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

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

  try {
    await connectToDatabase();
    const apiculteur = await findApiculteurForSession(session);
    if (!apiculteur) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const doc = await Apiculteur.findById(apiculteur._id);
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sub = doc.fermes.id(id);
    if (!sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (typeof body.name === "string") {
      const v = body.name.trim();
      if (v.length < 1) {
        return NextResponse.json(
          { error: "Le nom est requis." },
          { status: 400 }
        );
      }
      sub.name = v.slice(0, 120);
    }
    if (typeof body.rucheCount === "number" && body.rucheCount >= 0) {
      sub.rucheCount = Math.floor(body.rucheCount);
    }
    if (typeof body.address === "string") {
      sub.address = body.address.trim().slice(0, 240);
    }
    if (typeof body.plusCode === "string") {
      sub.plusCode = body.plusCode.trim().slice(0, 16);
    }
    if ("lat" in body) {
      sub.lat = typeof body.lat === "number" ? body.lat : null;
    }
    if ("lng" in body) {
      sub.lng = typeof body.lng === "number" ? body.lng : null;
    }
    if (typeof body.gatewayCount === "number" && body.gatewayCount >= 0) {
      sub.gatewayCount = Math.floor(body.gatewayCount);
    }
    if (typeof body.ruchesAttention === "number" && body.ruchesAttention >= 0) {
      sub.ruchesAttention = Math.floor(body.ruchesAttention);
    }

    syncTotals(doc);
    await doc.save();

    return NextResponse.json({
      item: toFermeListItem(sub, doc.region ?? ""),
    });
  } catch (error) {
    console.error("PATCH /api/fermes/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fermes/[id] — remove one ferme from the apiculteur profile.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "hives.update.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const apiculteur = await findApiculteurForSession(session);
    if (!apiculteur) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const doc = await Apiculteur.findById(apiculteur._id);
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sub = doc.fermes.id(id);
    if (!sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    sub.deleteOne();
    syncTotals(doc);
    await doc.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/fermes/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
