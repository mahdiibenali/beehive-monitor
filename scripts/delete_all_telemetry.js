const mongoose = require("mongoose");

const TelemetrySchema = new mongoose.Schema({}, { strict: false });
const Telemetry = mongoose.models.Telemetry || mongoose.model("Telemetry", TelemetrySchema);

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const result = await Telemetry.deleteMany({});
  console.log(`Deleted all ${result.deletedCount} telemetry documents.`);
  
  await mongoose.disconnect();
}

run().catch(console.error);
