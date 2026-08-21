import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

/**
 * A maintenance demand filed by an apiculteur (eventually from the
 * mobile app). The admin / super-admin reviews it from the
 * "Gestion maintenance" screen and marks it as treated when handled.
 *
 * Design rules
 * ─────────────
 * • The apiculteur is referenced by id, **and** a small snapshot of
 *   their profile is denormalized into `apiculteurSnapshot`. This keeps
 *   the demand readable even if the apiculteur is later deleted, and
 *   lets the list page render without populating refs.
 * • `status` is the simple binary the design exposes ("Traité" / "Non
 *   traité"). When a demand is resolved we stamp `treatedAt` and
 *   `treatedBy` so we can show "Traité le …" later.
 * • `startedAt` / `dueAt` form the date range column ("09/06 - 12/06").
 *   `dueAt` is optional — when omitted we just show `startedAt`.
 * • `attachmentUrl` is the file the apiculteur uploaded with the demand
 *   (rendered as the "Téléchargé" button in the drawer header).
 */
const ApiculteurSnapshotSchema = new Schema(
  {
    name: { type: String, default: "", trim: true, maxlength: 120 },
    email: { type: String, default: "", trim: true, maxlength: 200 },
    phone: { type: String, default: "", trim: true, maxlength: 32 },
    avatarSrc: { type: String, default: "" },
    rucheCount: { type: Number, default: 0, min: 0 },
    fermeCount: { type: Number, default: 0, min: 0 },
    /** When the apiculteur first joined Nahoul — shown as "INSCRIPTION". */
    inscriptionAt: { type: Date, default: null },
  },
  { _id: false }
);

const TreatedBySchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, default: "" },
    role: { type: String, default: "" },
  },
  { _id: false }
);

/**
 * A single reply in the maintenance ticket thread.
 *
 * Author info is denormalized at write-time (name / role / avatar) so the
 * conversation stays readable even after the user is renamed or deleted.
 */
const ReplySchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    authorName: { type: String, default: "", trim: true, maxlength: 120 },
    authorRole: { type: String, default: "", trim: true, maxlength: 32 },
    authorAvatarSrc: { type: String, default: "" },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const MaintenanceSchema = new Schema(
  {
    apiculteurId: {
      type: Schema.Types.ObjectId,
      ref: "Apiculteur",
      default: null,
      index: true,
    },
    apiculteurSnapshot: {
      type: ApiculteurSnapshotSchema,
      default: () => ({}),
    },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 4000 },

    status: {
      type: String,
      enum: ["non-traite", "traite"],
      default: "non-traite",
      index: true,
    },

    startedAt: { type: Date, default: () => new Date() },
    dueAt: { type: Date, default: null },

    treatedAt: { type: Date, default: null },
    treatedBy: { type: TreatedBySchema, default: () => ({}) },

    attachmentUrl: { type: String, default: "", trim: true, maxlength: 500 },

    /** Conversation thread (admin ↔ apiculteur). Newest at the end. */
    replies: { type: [ReplySchema], default: [] },
    /** Last activity timestamp — bumped on reply / status change. */
    lastActivityAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

MaintenanceSchema.index({ status: 1, createdAt: -1 });
MaintenanceSchema.index({ "apiculteurSnapshot.email": 1 });
MaintenanceSchema.index({ title: 1 });

export type MaintenanceDocument = InferSchemaType<typeof MaintenanceSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Maintenance: Model<MaintenanceDocument> =
  (mongoose.models.Maintenance as Model<MaintenanceDocument>) ||
  mongoose.model<MaintenanceDocument>("Maintenance", MaintenanceSchema);
