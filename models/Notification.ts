import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

/**
 * A notification delivered to a single user or broadcast to a whole role.
 *
 * Design rules
 * ─────────────
 * • Exactly one targeting field is set per row:
 *     - `userId` → direct (only that one user sees it)
 *     - `role`   → broadcast (every user with that role sees it)
 *   Both are indexed; we never query the other in the same path.
 * • `actor` is denormalized so the message stays readable after the
 *   originating user is renamed or deleted.
 * • Read state is per-recipient via `readBy[]`. For direct notifications
 *   this collapses to a 0/1 array; for broadcasts it grows as recipients
 *   ack the message.
 * • `meta` is a free-form bag for client deep-links / extra context.
 */

const ActorSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, default: "" },
    role: { type: String, default: "" },
  },
  { _id: false }
);

const NotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    role: {
      type: String,
      enum: ["super-admin", "admin", "apiculteur"],
      default: null,
      index: true,
    },

    title: { type: String, default: "", trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    category: {
      type: String,
      enum: ["batterie", "capteur", "venin", "autre"],
      default: "autre",
    },
    link: { type: String, default: null, maxlength: 250 },

    action: { type: String, default: "" },
    entity: { type: String, default: "" },
    entityId: { type: String, default: null },
    actor: { type: ActorSchema, default: () => ({}) },

    readBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ role: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof NotificationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const Notification: Model<NotificationDocument> =
  (mongoose.models.Notification as Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);
