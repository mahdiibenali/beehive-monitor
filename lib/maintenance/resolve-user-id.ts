import "server-only";
import { Apiculteur } from "@/models/Apiculteur";

/**
 * Resolve a maintenance ticket's apiculteur user-account id + the
 * apiculteur's live avatar.
 *
 * Returns `null` for both when the apiculteur record was deleted, and
 * `null` for `userId` when no `User` account has ever been linked.
 * The live avatar overrides the (potentially stale) snapshot avatar
 * stored on the maintenance document.
 */
export async function resolveApiculteurLive(
  apiculteurId: { toString: () => string } | string | null | undefined
): Promise<{ userId: string | null; avatarSrc: string | null }> {
  if (!apiculteurId) return { userId: null, avatarSrc: null };
  const id =
    typeof apiculteurId === "string" ? apiculteurId : apiculteurId.toString();
  const record = await Apiculteur.findById(id)
    .select("userId avatarSrc")
    .lean();
  if (!record) return { userId: null, avatarSrc: null };
  return {
    userId: record.userId ? record.userId.toString() : null,
    avatarSrc: record.avatarSrc ?? null,
  };
}

/** @deprecated use {@link resolveApiculteurLive} */
export async function resolveApiculteurUserId(
  apiculteurId: { toString: () => string } | string | null | undefined
): Promise<string | null> {
  const { userId } = await resolveApiculteurLive(apiculteurId);
  return userId;
}
