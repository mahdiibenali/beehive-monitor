import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    // Fetch all hives from all apiculteurs to simulate them
    const apiculteurs = await Apiculteur.find({}).lean();
    
    const hivesToSimulate: any[] = [];
    
    for (const apic of apiculteurs) {
      if (!apic.fermes) continue;
      for (const [fIndex, ferme] of apic.fermes.entries()) {
        // Try to get the first gateway serial if it exists, otherwise fallback to generated one
        const realGateway = (ferme as any).gateways?.[0]?.serialNumber;
        const gatewayId = realGateway || `GW_MASTER_${ferme._id.toString().slice(-6).toUpperCase()}`;
        
        if (!ferme.ruches || ferme.ruches.length === 0) {
            // For fermes that only have counts, we still simulate the total count
            for (let index = 0; index < (ferme.rucheCount || 0); index++) {
                const id = `${ferme._id.toString()}-ruche-${index + 1}`;
                hivesToSimulate.push({
                    id,
                    name: `Ruche ${String(index + 1).padStart(2, "0")}`,
                    gatewayId,
                    farmName: ferme.name
                });
            }
        } else {
            // For fermes with actual populated ruche arrays
            for (const ruche of ferme.ruches) {
                hivesToSimulate.push({
                    id: ruche._id.toString(),
                    name: ruche.name,
                    gatewayId,
                    farmName: ferme.name
                });
            }
        }
      }
    }

    return NextResponse.json({ hives: hivesToSimulate });
  } catch (error) {
    console.error("GET /api/simulator/hives error:", error);
    return NextResponse.json({ error: "Failed to load hives" }, { status: 500 });
  }
}
