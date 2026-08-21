import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Telemetry } from "@/models/Telemetry";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // In a real system, there might be multiple end_device_data elements.
    // We'll extract the hiveId and gatewayId directly from the payload.
    const gatewayId = payload.gateway_id;
    
    if (!gatewayId) {
      return NextResponse.json({ error: "Missing gateway_id" }, { status: 400 });
    }

    await connectToDatabase();

    await Telemetry.create({
      gatewayId,
      hiveId: "GATEWAY", // Marker for gateway-level payloads
      timestamp: new Date(payload.gateway_timestamp || Date.now()),
      payload
    });

    return NextResponse.json({ success: true, message: "Telemetry stored" });
  } catch (error) {
    console.error("POST /api/simulator/push error:", error);
    return NextResponse.json({ error: "Failed to store telemetry" }, { status: 500 });
  }
}
