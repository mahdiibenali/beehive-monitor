import "server-only";
import mongoose from "mongoose";
import type { Role } from "@/lib/auth/roles";

/**
 * Build the MongoDB filter that returns every notification *visible*
 * to the given viewer. Centralized so the listing, SSE and read-state
 * endpoints stay perfectly in sync.
 *
 * Rules
 * ─────
 *  • Direct notifications addressed to the viewer's `userId` → always.
 *  • Role broadcasts targeting the viewer's role → **only** the ones
 *    authored after the viewer's account was created. This stops a
 *    brand-new admin from inheriting the entire historical feed the
 *    moment they sign in.
 *  • A user never sees notifications they themselves authored.
 */
export function buildVisibilityFilter(viewer: {
  id: string;
  role: Role;
  joinedAt?: string | null;
}) {
  const viewerId = new mongoose.Types.ObjectId(viewer.id);
  // Default to "now" when we somehow don't have a join date — keeps the
  // safer behaviour of "no history before me" rather than leaking the
  // entire archive.
  const joinedAt = viewer.joinedAt ? new Date(viewer.joinedAt) : new Date();

  return {
    $or: [
      { userId: viewerId },
      { role: viewer.role, createdAt: { $gte: joinedAt } },
    ],
    "actor.id": { $ne: viewerId },
  };
}
