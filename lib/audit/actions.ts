/**
 * Stable string identifiers for every action recorded in the audit log.
 *
 * Format: `<entity>.<verb>[.<modifier>]`
 *
 * Use the `AUDIT_ACTIONS` constant when calling `logAudit()` — never inline
 * string literals (typos won't be caught and will break the future viewer
 * filters).
 */
export const AUDIT_ACTIONS = {
  // Auth ──────────────────────────────────────────────
  AuthLogin: "auth.login",
  AuthLoginFailed: "auth.login.failed",
  AuthLogout: "auth.logout",

  // User account ──────────────────────────────────────
  UserUpdateProfile: "user.profile.update",
  UserChangePassword: "user.password.change",
  UserCreate: "user.create",
  UserUpdate: "user.update",
  UserDelete: "user.delete",

  // Items (template CRUD — replace when domain models land) ─
  ItemCreate: "item.create",
  ItemUpdate: "item.update",
  ItemDelete: "item.delete",

  // Apiculteurs (Gestion d'abonnements) ───────────────
  ApiculteurCreate: "apiculteur.create",
  ApiculteurUpdate: "apiculteur.update",
  ApiculteurDelete: "apiculteur.delete",

  // Maintenance demands (Gestion maintenance) ─────────
  MaintenanceCreate: "maintenance.create",
  MaintenanceUpdate: "maintenance.update",
  MaintenanceResolve: "maintenance.resolve",
  MaintenanceReopen: "maintenance.reopen",
  MaintenanceReply: "maintenance.reply",
  MaintenanceDelete: "maintenance.delete",

  // Gateway pairing (mobile-only flow) ─────────
  GatewayPair: "gateway.pair",

  // Contact messages (public form → admin inbox) ──────
  ContactMessageCreate: "contact-message.create",
  ContactMessageRead: "contact-message.read",
  ContactMessageHandle: "contact-message.handle",
  ContactMessageReopen: "contact-message.reopen",
  ContactMessageDelete: "contact-message.delete",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/** Entity namespaces for grouping / filtering in the viewer. */
export const AUDIT_ENTITIES = {
  Auth: "auth",
  User: "user",
  Item: "item",
  Apiculteur: "apiculteur",
  Maintenance: "maintenance",
  Gateway: "gateway",
  ContactMessage: "contact-message",
} as const;

export type AuditEntity = (typeof AUDIT_ENTITIES)[keyof typeof AUDIT_ENTITIES];
