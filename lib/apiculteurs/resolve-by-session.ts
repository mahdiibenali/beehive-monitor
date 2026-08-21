import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur, type ApiculteurDocument } from "@/models/Apiculteur";
import type { SessionUser } from "@/lib/auth/current-user";

export type LeanApiculteurForSession = mongoose.FlattenMaps<ApiculteurDocument>;

/**
 * Resolve the `Apiculteur` document linked to the signed-in user.
 * Tries `userId` first, then falls back to email (legacy / seeded rows).
 */
export async function findApiculteurForSession(
  session: SessionUser
): Promise<LeanApiculteurForSession | null> {
  if (session.role !== "apiculteur") return null;

  await connectToDatabase();

  if (mongoose.Types.ObjectId.isValid(session.id)) {
    const byUser = await Apiculteur.findOne({
      userId: new mongoose.Types.ObjectId(session.id),
    }).lean();
    if (byUser) return byUser;
  }

  const byEmail = await Apiculteur.findOne({
    email: session.email.toLowerCase(),
  }).lean();
  return byEmail ?? null;
}
