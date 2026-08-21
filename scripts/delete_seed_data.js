const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const TelemetrySchema = new mongoose.Schema({
  gatewayId: { type: String, required: true },
  hiveId: { type: String, required: true },
});

const Telemetry = mongoose.models.Telemetry || mongoose.model("Telemetry", TelemetrySchema);

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const result = await Telemetry.deleteMany({ hiveId: "HIVE_MOCK" });
  console.log(`Deleted ${result.deletedCount} seeded telemetry documents.`);
  
  await mongoose.disconnect();
}

run().catch(console.error);
