/**
 * Debug script: verify super@nahoul.tn exists and password checks out.
 *   npm run verify-login
 */
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";

async function main() {
  await connectToDatabase();
  const email = "super@nahoul.tn";
  const password = "Super123!";

  const user = await User.findOne({ email }).select("+passwordHash").lean();
  console.log("User found:", !!user);
  if (!user) {
    console.log("No user with email:", email);
    console.log("All users in DB:");
    const all = await User.find({}).select("email role isActive").lean();
    console.log(all);
    await mongoose.disconnect();
    return;
  }

  console.log("  email:", user.email);
  console.log("  role:", user.role);
  console.log("  isActive:", user.isActive);
  console.log("  has passwordHash:", !!user.passwordHash);
  console.log("  passwordHash length:", user.passwordHash?.length ?? 0);

  if (!user.passwordHash) {
    console.log("\nFIX: passwordHash missing — run: npm run seed");
    await mongoose.disconnect();
    process.exit(1);
  }

  const ok = await verifyPassword(password, user.passwordHash);
  console.log("\nverifyPassword('Super123!', hash):", ok);

  if (!ok) {
    console.log("\nFIX: password mismatch — run: npm run seed");
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
