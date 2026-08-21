import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canDo } from "@/lib/auth/roles";
import { findApiculteurForSession } from "@/lib/apiculteurs/resolve-by-session";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/log";
import { toFermeListItem } from "@/lib/fermes/serializer";
import { Telemetry } from "@/models/Telemetry";

export const dynamic = "force-dynamic";

function readSerial(body: Record<string, unknown>) {
  const raw =
    body.serialNumber ??
    body.gatewayId ??
    body.deviceId ??
    (body.payload && typeof body.payload === "object"
      ? (body.payload as Record<string, unknown>).gateway_id
      : null);
  return typeof raw === "string" ? raw.trim().slice(0, 120) : "";
}

function normalisePayload(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  return raw as Record<string, unknown>;
}

/**
 * POST /api/gateways
 *
 * Mobile-only pairing endpoint. Body:
 * { fermeId, serialNumber? | gatewayId? | deviceId?, source: "qr"|"manual", payload? }
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

  const fermeId = typeof body.fermeId === "string" ? body.fermeId : "";
  if (!mongoose.Types.ObjectId.isValid(fermeId)) {
    return NextResponse.json(
      { error: "Identifiant ferme invalide." },
      { status: 400 }
    );
  }

  const serialNumber = readSerial(body);
  if (!serialNumber) {
    return NextResponse.json(
      { error: "Numero de serie requis." },
      { status: 400 }
    );
  }

  const source = body.source === "qr" ? "qr" : "manual";
  let payload = normalisePayload(body.payload);
  const label =
    typeof body.label === "string" && body.label.trim()
      ? body.label.trim().slice(0, 120)
      : serialNumber;

  try {
    await connectToDatabase();
    
    // If payload is tiny/missing (e.g., from the new simplified QR code), 
    // fetch the heavy payload that the simulator pre-registered.
    if (!payload || !payload.end_device_data) {
      const telemetryDoc = await Telemetry.findOne({ gatewayId: serialNumber }).sort({ timestamp: -1 });
      if (telemetryDoc && telemetryDoc.payload) {
        payload = telemetryDoc.payload;
      }
    }

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

    const duplicate = doc.fermes.some((ferme) =>
      (ferme.gateways ?? []).some(
        (gateway) =>
          gateway.serialNumber.toLowerCase() === serialNumber.toLowerCase()
      )
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "Cette gateway est deja associee." },
        { status: 409 }
      );
    }

    const ferme = doc.fermes.id(fermeId);
    if (!ferme) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    ferme.gateways.push({
      serialNumber,
      label,
      source,
      pairedAt: new Date(),
      payload,
    });
    ferme.gatewayCount = Math.max(
      ferme.gatewayCount ?? 0,
      ferme.gateways.length
    );

    const location =
      payload && typeof payload.gateway_location === "object"
        ? (payload.gateway_location as Record<string, unknown>)
        : null;
    if (location) {
      if (typeof location.lat === "number" && ferme.lat == null) {
        ferme.lat = location.lat;
      }
      if (typeof location.lng === "number" && ferme.lng == null) {
        ferme.lng = location.lng;
      }
    }

    // Auto-create Ruche if payload contains end_device_data
    const endDevice = payload && typeof payload.end_device_data === "object" ? (payload.end_device_data as Record<string, unknown>) : null;
    if (endDevice && typeof endDevice.device_id === "string") {
      const deviceId = endDevice.device_id;
      const exists = ferme.ruches.some(r => r.name === deviceId);
      if (!exists) {
        ferme.ruches.push({
          name: deviceId,
          serial: deviceId,
          gatewayIndex: ferme.gateways.length
        });
        ferme.rucheCount = Math.max(ferme.rucheCount ?? 0, ferme.ruches.length);
        doc.rucheCount = (doc.rucheCount ?? 0) + 1;
      }
    }

    await doc.save();

    await logAudit({
      actor: session,
      action: AUDIT_ACTIONS.GatewayPair,
      entity: AUDIT_ENTITIES.Gateway,
      entityId: serialNumber,
      summary: `${session.name} a associe la gateway ${serialNumber}`,
      metadata: { fermeId, source },
      request,
    });

    return NextResponse.json(
      {
        gateway: {
          serialNumber,
          label,
          source,
          pairedAt: new Date().toISOString(),
        },
        ferme: toFermeListItem(ferme, doc.region ?? ""),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/gateways error:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
