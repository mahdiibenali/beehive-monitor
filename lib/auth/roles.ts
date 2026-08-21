/**
 * Single source of truth for roles, hierarchy and permissions.
 * Every guard in the app (menu, RoleGate, middleware, API) must
 * read from this file — never hard-code role strings elsewhere.
 */

export const ROLES = ["super-admin", "admin", "apiculteur"] as const;
export type Role = (typeof ROLES)[number];

/** Higher rank = more privileges. */
const ROLE_RANK: Record<Role, number> = {
  "super-admin": 3,
  admin: 2,
  apiculteur: 1,
};

export const ROLE_LABEL: Record<Role, string> = {
  "super-admin": "Super admin",
  admin: "Admin",
  apiculteur: "Apiculteur",
};

/**
 * Permission keys are FEATURES (verbs on a noun).
 * Each permission lists the roles that own it.
 * Add new permissions here as the app grows — never inline a role string in a component.
 */
export const PERMISSIONS = {
  // Admin management — only super-admin
  "admins.read": ["super-admin"],
  "admins.create": ["super-admin"],
  "admins.update": ["super-admin"],
  "admins.delete": ["super-admin"],

  // Apiculteur management — super-admin + admin
  "apiculteurs.read": ["super-admin", "admin"],
  "apiculteurs.create": ["super-admin", "admin"],
  "apiculteurs.update": ["super-admin", "admin"],
  "apiculteurs.delete": ["super-admin"],

  // Maintenance — super-admin + admin manage demands; apiculteurs file them.
  "maintenance.read": ["super-admin", "admin"],
  "maintenance.update": ["super-admin", "admin"],
  "maintenance.delete": ["super-admin"],
  "maintenance.create": ["apiculteur"],
  // Replying is open to every party of a thread (gated by the route).
  "maintenance.reply": ["super-admin", "admin", "apiculteur"],

  // Hives — apiculteur sees their own; admins see everything
  "hives.read.own": ["apiculteur"],
  "hives.read.all": ["super-admin", "admin"],
  "hives.update.own": ["apiculteur"],

  // System / dangerous operations — super-admin only
  "system.read": ["super-admin"],

  // Operational dashboard — global counters, charts, recent activity.
  // Both super-admin and admin can read it; the API trims sensitive blocks
  // (e.g. the admin presence list) for non-super-admins.
  "dashboard.read": ["super-admin", "admin"],

  // Audit log viewer — super-admin only (read-only, append-only collection)
  "audit.read": ["super-admin"],

  // Public contact form inbox — super-admin + admin can triage messages,
  // super-admin can also delete spam.
  "contact-messages.read": ["super-admin", "admin"],
  "contact-messages.update": ["super-admin", "admin"],
  "contact-messages.delete": ["super-admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

/** A role A has at least as much power as role B. */
export function hasAtLeastRole(role: Role, requiredRole: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[requiredRole];
}

/** Whether a role can perform a permission. */
export function canDo(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

/** Whether a role matches any of the allowed roles. */
export function hasAnyRole(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}
