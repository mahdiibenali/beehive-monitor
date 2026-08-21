const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");



const TelemetrySchema = new mongoose.Schema({
  gatewayId: { type: String, required: true },
  hiveId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  payload: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, expires: '90d', default: Date.now }
});

const Telemetry = mongoose.models.Telemetry || mongoose.model("Telemetry", TelemetrySchema);

const ApiculteurSchema = new mongoose.Schema({}, { strict: false });
const Apiculteur = mongoose.models.Apiculteur || mongoose.model("Apiculteur", ApiculteurSchema);

function pad(v) { return String(v).padStart(2, '0'); }

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  // Get distinct gateways
  const gateways = await Telemetry.distinct("gatewayId");
  console.log(`Found ${gateways.length} distinct gateways:`, gateways);

  if (gateways.length === 0) {
    console.log("No telemetry exists. Run simulator first.");
    process.exit(0);
  }

  let count = 0;
  const now = new Date();
  const docs = [];

  for (const gatewayId of gateways) {
    // Generate 1 payload per day for the last 365 days
    for (let i = 1; i <= 365; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      
      // Add some realistic wave-like variation
      const wave = Math.sin(i / 10);
      const battery_soc = Math.max(20, Math.min(100, 75 + (wave * 20) + (Math.random() * 5 - 2.5)));
      const battery_voltage = 3.3 + (battery_soc / 100) * 0.9; // 3.3 to 4.2V
      const excitation_voltage = 12.0 + (wave * 0.5) + (Math.random() * 0.2);

      docs.push({
        gatewayId,
        hiveId: "HIVE_MOCK",
        timestamp: d,
        createdAt: d,
        payload: {
          gateway_id: gatewayId,
          power_system: {
            battery_soc,
            battery_voltage
          },
          venom_module: {
            excitation_voltage
          }
        }
      });
      count++;
    }
  }

  console.log(`Inserting ${count} historical telemetry documents...`);
  await Telemetry.insertMany(docs);
  
  console.log("Seeding historical sessions for production/activite...");
  const apiculteurs = await Apiculteur.find({});
  let sessionCount = 0;
  for (const api of apiculteurs) {
    if (!api.fermes) continue;
    let modified = false;
    for (const f of api.fermes) {
      if (!f.gateways) continue;
      for (const g of f.gateways) {
        g.sessions = g.sessions || [];
        // Delete old mock sessions if any
        g.sessions = g.sessions.filter(s => s.hiveId !== "HIVE_MOCK");
        
        for (let i = 1; i <= 365; i++) {
          // 30% chance to have a session on a given day
          if (Math.random() > 0.3) continue;
          
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          
          const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getHours()+1)}:${pad(d.getMinutes())}`;
          
          g.sessions.push({
            hiveId: "HIVE_MOCK",
            date: dateStr,
            time: timeStr,
            grams: 0.1 + Math.random() * 0.5
          });
          sessionCount++;
        }
      }
      modified = true;
    }
    if (modified) {
      api.markModified("fermes");
      await api.save();
    }
  }
  console.log(`Inserted ${sessionCount} historical sessions.`);
  console.log("Done!");
  
  await mongoose.disconnect();
}

run().catch(console.error);
