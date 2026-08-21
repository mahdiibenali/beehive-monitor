import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ exists: false });

  try {
    await connectToDatabase();
    
    // Check if any Apiculteur has this gateway paired
    const exists = await Apiculteur.findOne({
      "fermes.gateways.serialNumber": { $regex: new RegExp(`^${id}$`, "i") }
    });

    return NextResponse.json({ exists: !!exists });
  } catch (err) {
    return NextResponse.json({ exists: false });
  }
}
