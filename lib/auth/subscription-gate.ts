import "server-only";
import { Apiculteur } from "@/models/Apiculteur";
import { deriveStatus } from "@/lib/apiculteurs/subscription";

export type AccessDenialReason =
  | "no-subscription"
  | "expired"
  | "suspended"
  | "ok";

export interface ApiculteurAccessResult {
  ok: boolean;
  /** Stable machine-readable reason; "ok" when access is granted. */
  reason: AccessDenialReason;
  /** Effective status of the apiculteur (undefined if no record). */
  status?: "active" | "expired" | "suspended";
  /** A human-friendly French message ready to be returned to the client. */
  message: string;
}

/**
 * Single source of truth for "can this apiculteur use the app right now?".
 *
 * - No matching Apiculteur record → deny ("no-subscription")
 * - Suspended or expired (or active-but-overdue) → deny
 * - Active and within validity → allow
 *
 * Used by `/api/auth/login` (to block the issue-cookie step) and
 * `getCurrentUser` (to revoke live sessions when status changes).
 */
export async function checkApiculteurAccess(
  email: string
): Promise<ApiculteurAccessResult> {
  const apic = await Apiculteur.findOne({ email: email.toLowerCase() })
    .select({
      subscriptionStatus: 1,
      subscriptionEndsAt: 1,
      subscriptionSuspendedAt: 1,
    })
    .lean();

  if (!apic) {
    return {
      ok: false,
      reason: "no-subscription",
      message:
        "Aucun abonnement n'est associé à ce compte. Contactez votre administrateur.",
    };
  }

  const status = deriveStatus({
    status: apic.subscriptionStatus ?? "active",
    endsAt: apic.subscriptionEndsAt ?? null,
  });

  if (status === "active") {
    return { ok: true, reason: "ok", status, message: "" };
  }

  if (status === "suspended") {
    return {
      ok: false,
      reason: "suspended",
      status,
      message:
        "Votre abonnement est suspendu. Contactez votre administrateur pour le réactiver.",
    };
  }

  return {
    ok: false,
    reason: "expired",
    status,
    message:
      "Votre abonnement a expiré. Veuillez le renouveler auprès de votre administrateur.",
  };
}
