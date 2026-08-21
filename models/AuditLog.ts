import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

/**
 * Append-only collection of every meaningful action a user performs.
 *
 * Design rules
 * ─────────────
 * • Actor info is *denormalized* (email/name/role copied at write-time) so logs
 *   stay readable even after the user is renamed or deleted.
 * • `action` follows a stable `<entity>.<verb>` namespace (e.g. `item.create`,
 *   `user.password.change`, `auth.login.failed`). Use constants from
 *   `lib/audit/actions.ts`.
 * • `changes[]` stores a small diff for updates (`{ field, before, after }`).
 *   Never put a password / secret in there.
 * • `status` allows recording both successes and failures (think: failed login
 *   attempts) without inventing a parallel collection.
 */
const ChangeSchema = new Schema(
  {
    field: { type: String, required: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const ActorSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, default: "" },
    name: { type: String, default: "" },
    role: { type: String, default: "" },
  },
  { _id: false }
);

const AuditLogSchema = new Schema(
  {
    actor: { type: ActorSchema, default: () => ({}) },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: null },
    summary: { type: String, default: "" },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
    changes: { type: [ChangeSchema], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Hot paths for the future audit-log viewer.
AuditLogSchema.index({ "actor.id": 1, createdAt: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof AuditLogSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const AuditLog: Model<AuditLogDocument> =
  (mongoose.models.AuditLog as Model<AuditLogDocument>) ||
  mongoose.model<AuditLogDocument>("AuditLog", AuditLogSchema);
