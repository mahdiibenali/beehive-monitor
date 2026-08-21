import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const farmId = searchParams.get("farmId");

  if (!farmId || !mongoose.Types.ObjectId.isValid(farmId)) {
    return NextResponse.json({ error: "Invalid farmId" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    // Use session.id to find apiculteur since they are logged in
    const apiculteur = await Apiculteur.findOne({ userId: session.id });
    if (!apiculteur) {
      return NextResponse.json({ error: "Apiculteur introuvable." }, { status: 404 });
    }

    const ferme = apiculteur.fermes.id(farmId);
    if (!ferme) {
      return NextResponse.json({ error: "Ferme introuvable." }, { status: 404 });
    }

    // Return sessions from the first gateway, or empty array if none
    const firstGateway = ferme.gateways[0];
    const sessions = firstGateway?.sessions ?? [];
    
    // Map them to the shape expected by mobile frontend: { id, date, time }
    const mappedSessions = sessions.map((s: any) => ({
      id: s._id.toString(),
      date: s.date,
      time: s.time
    }));

    return NextResponse.json(mappedSessions);
  } catch (error) {
    console.error("GET /api/mobile/sessions error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

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

  const { farmId, gatewayId, date, time, grams = 0, hiveId } = body;

  if (!farmId || typeof farmId !== "string" || !mongoose.Types.ObjectId.isValid(farmId)) {
    return NextResponse.json({ error: "Invalid farmId" }, { status: 400 });
  }
  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!time || typeof time !== "string") {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }
  const parsedGrams = Number(grams);
  if (isNaN(parsedGrams)) {
    return NextResponse.json({ error: "Invalid grams" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const apiculteur = await Apiculteur.findOne({ userId: session.id });
    if (!apiculteur) {
      return NextResponse.json({ error: "Apiculteur introuvable." }, { status: 404 });
    }

    const ferme = apiculteur.fermes.id(farmId);
    if (!ferme) {
      return NextResponse.json({ error: "Ferme introuvable." }, { status: 404 });
    }

    let targetGateway;
    if (gatewayId) {
      targetGateway = ferme.gateways.find((g: any) => g._id.toString() === gatewayId || g.serialNumber === gatewayId);
    }
    
    if (!targetGateway) {
      if (!ferme.gateways || ferme.gateways.length === 0) {
        ferme.gateways.push({ serialNumber: "GW-001", label: "Gateway par defaut", source: "manual", pairedAt: new Date() });
      }
      targetGateway = ferme.gateways[0];
    }

    if (!targetGateway.sessions) {
      targetGateway.sessions = [] as any;
    }
    const newSession = { date, time, grams: parsedGrams, hiveId: typeof hiveId === "string" ? hiveId : null };
    targetGateway.sessions.push(newSession);
    
    await apiculteur.save();

    // Get the newly added session which has an _id generated
    const savedSession = targetGateway.sessions[targetGateway.sessions.length - 1];

    return NextResponse.json(
      { id: savedSession._id.toString(), date: savedSession.date, time: savedSession.time, grams: savedSession.grams },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/mobile/sessions error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!canDo(session.role, "hives.update.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const farmId = searchParams.get("farmId");
  const id = searchParams.get("id");

  if (!farmId || !mongoose.Types.ObjectId.isValid(farmId)) {
    return NextResponse.json({ error: "Invalid farmId" }, { status: 400 });
  }
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const apiculteur = await Apiculteur.findOne({ userId: session.id });
    if (!apiculteur) {
      return NextResponse.json({ error: "Apiculteur introuvable." }, { status: 404 });
    }

    const ferme = apiculteur.fermes.id(farmId);
    if (!ferme) {
      return NextResponse.json({ error: "Ferme introuvable." }, { status: 404 });
    }

    if (!ferme.gateways || ferme.gateways.length === 0) {
      return NextResponse.json({ success: true });
    }

    const firstGateway = ferme.gateways[0];
    if (!firstGateway.sessions) {
      firstGateway.sessions = [] as any;
    }
    const sessionIndex = firstGateway.sessions.findIndex((s: any) => s._id.toString() === id);
    
    if (sessionIndex === -1) {
      return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
    }

    firstGateway.sessions.splice(sessionIndex, 1);
    await apiculteur.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/mobile/sessions error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
