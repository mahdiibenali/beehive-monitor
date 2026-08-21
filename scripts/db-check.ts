/**
 * Standalone DB connectivity test — does not require `next dev` to be running.
 *
 *   npm run db:check
 *
 * Prints the database it connected to and a ping round-trip in ms,
 * or exits with code 1 if the driver can't reach MongoDB.
 */
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

async function main() {
  const started = Date.now();
  console.log(`Connecting to ${process.env.MONGODB_URI ?? "(no MONGODB_URI set)"}…`);
  const conn = await connectToDatabase();

  await conn.connection.db?.admin().ping();
  console.log("");
  console.log("  ✓ Connection OK");
  console.log(`    database : ${conn.connection.name}`);
  console.log(`    host     : ${conn.connection.host}:${conn.connection.port}`);
  console.log(`    latency  : ${Date.now() - started} ms`);
  console.log("");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("");
  console.error("  ✗ Connection FAILED:", err instanceof Error ? err.message : err);
  console.error("");
  console.error("  Things to check:");
  console.error("    1. Is MongoDB actually running?  (Windows: 'Get-Service MongoDB' or check Compass)");
  console.error("    2. Is MONGODB_URI in .env.local correct?");
  console.error("    3. Firewall / antivirus blocking port 27017?");
  console.error("");
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
