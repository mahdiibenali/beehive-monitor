import "server-only";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserDocument } from "@/models/User";
import { readSession } from "./session";
import { checkApiculteurAccess } from "./subscription-gate";
import { Role } from "./roles";

/**
 * Shape of the user object returned to the client.
 * NEVER includes the password hash.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatarSrc?: string;
  region?: string;
  genre?: string;
  greeting?: string;
  /**
   * ISO timestamp of the user's account creation. Surfaced so server
   * code (e.g. notification queries) can filter role-broadcasts to the
   * ones authored *after* the user joined.
   */
  joinedAt?: string;
}

function toSessionUser(doc: UserDocument & { createdAt?: Date }): SessionUser {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone || undefined,
    role: doc.role as Role,
    avatarSrc: doc.avatarSrc || "/brand/avatar-sample.svg",
    region: doc.region || undefined,
    genre: doc.genre || undefined,
    greeting: "Bienvenue !",
    joinedAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
  };
}

/**
 * Reads the session cookie, verifies it, and returns the matching user.
 * Returns null if there is no valid session or the user no longer exists / is inactive.
 *
 * Use this in API route handlers — never trust the client.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await readSession();
  if (!session) return null;

  await connectToDatabase();
  const doc = await User.findById(session.uid).lean<UserDocument | null>();
  if (!doc || !doc.isActive) return null;

  // Live subscription gate for apiculteurs: a mid-session suspension or
  // expiry must revoke access on the very next request, not just at login.
  if (doc.role === "apiculteur") {
    const access = await checkApiculteurAccess(doc.email);
    if (!access.ok) return null;
  }

  return toSessionUser(doc);
}

export { toSessionUser };
