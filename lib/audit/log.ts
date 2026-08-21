import "server-only";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";
import type { SessionUser } from "@/lib/auth/current-user";
import type { AuditAction, AuditEntity } from "./actions";

/** Anonymous-ish actor (failed login, system task, …). */
export interface AnonymousActor {
  id?: string | null;
  email?: string;
  name?: string;
  role?: string;
}

export type AuditActor = SessionUser | AnonymousActor | null | undefined;

export interface AuditChange {
  field: string;
  before?: unknown;
  after?: unknown;
}

export interface AuditEntry {
  actor: AuditActor;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  summary?: string;
  status?: "success" | "failure";
  changes?: AuditChange[];
  metadata?: Record<string, unknown>;
  /** Pass the Next.js request to capture IP + user agent. */
  request?: Request | NextRequest;
}

function extractRequestMeta(req?: Request | NextRequest) {
  if (!req) return { ip: "", userAgent: "" };
  const ipHeader =
    req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";
  const ip = ipHeader.split(",")[0]?.trim() ?? "";
  const userAgent = req.headers.get("user-agent") ?? "";
  return { ip, userAgent };
}

function normaliseActor(actor: AuditActor) {
  if (!actor) {
    return { id: null, email: "", name: "", role: "" };
  }
  return {
    id: (actor as { id?: string | null }).id ?? null,
    email: actor.email ?? "",
    name: actor.name ?? "",
    role: actor.role ?? "",
  };
}

/**
 * Persist an audit entry. **Best-effort**: any failure is swallowed and
 * logged to the server console so the user-facing operation never fails just
 * because the audit write failed.
 *
 * ```ts
 * await logAudit({
 *   actor: session,
 *   action: AUDIT_ACTIONS.ItemUpdate,
 *   entity: AUDIT_ENTITIES.Item,
 *   entityId: item.id,
 *   changes: diff(before, after, ["name", "description"]),
 *   request,
 * });
 * ```
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await connectToDatabase();
    const { ip, userAgent } = extractRequestMeta(entry.request);
    await AuditLog.create({
      actor: normaliseActor(entry.actor),
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      summary: entry.summary ?? "",
      status: entry.status ?? "success",
      changes: entry.changes ?? [],
      metadata: entry.metadata ?? {},
      ip,
      userAgent,
    });
  } catch (err) {
    console.error("[audit] write failed:", err);
  }
}

/**
 * Tiny field-by-field diff helper for update endpoints.
 * Compares the listed fields and returns only the ones that changed.
 * `undefined` values in `after` are skipped (treated as "not touched").
 *
 * NEVER pass a password / secret field — audit logs are kept forever.
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  fields: (keyof T & string)[]
): AuditChange[] {
  const changes: AuditChange[] = [];
  for (const f of fields) {
    if (after[f] === undefined) continue;
    if (after[f] !== before[f]) {
      changes.push({ field: f, before: before[f], after: after[f] });
    }
  }
  return changes;
}

export { AUDIT_ACTIONS, AUDIT_ENTITIES } from "./actions";
