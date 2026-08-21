import { connectToDatabase } from "../lib/mongodb";
import { User } from "../models/User";

async function test() {
  await connectToDatabase();
  const user = await User.findOne({ email: "apiculteur@nahoul.tn" });
  if (!user) {
    console.log("User not found!");
    process.exit(1);
  }
  console.log("Database user genre:", user.genre);
  
  // Try to update via mongoose
  user.genre = "Homme";
  await user.save();
  
  const updated = await User.findOne({ email: "apiculteur@nahoul.tn" });
  console.log("Updated database user genre:", updated?.genre);
  
  // Import the mapper to test it
  const { toSessionUser } = require("../lib/auth/current-user");
  const sessionUser = toSessionUser(updated);
  console.log("Session User object:", sessionUser);
  
  process.exit(0);
}

test().catch(console.error);
