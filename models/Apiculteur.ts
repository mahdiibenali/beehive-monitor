import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

/**
 * A single hive on a ferme. Embedded twice-deep (apiculteur → ferme → ruche).
 */
const RucheSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    /** Optional device serial / model number printed on the sensor. */
    serial: { type: String, default: "", trim: true, maxlength: 64 },
    /** Aggregated health status (driven later by telemetry). */
    status: {
      type: String,
      enum: ["alerte", "normale"],
      default: "normale",
    },
    /** Number of active alerts on this ruche (0 → no alerts). */
    alerts: { type: Number, default: 0, min: 0 },
    /** Which Gateway (1-based) this ruche reports through. */
    gatewayIndex: { type: Number, default: 1, min: 1 },
    /** GPS pin, jittered around the ferme. */
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: true, timestamps: false }
);

/**
 * A single farm / apiary site owned by an apiculteur.
 * Embedded sub-document; not its own collection.
 */
const FermeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    rucheCount: { type: Number, default: 0, min: 0 },
    /** Free-form postal address (street, city, country). */
    address: { type: String, default: "", trim: true, maxlength: 240 },
    /** Optional Plus Code (e.g. "J9W6+VM"). */
    plusCode: { type: String, default: "", trim: true, maxlength: 16 },
    /** Coordinates for the rich detail map. */
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    /** Nahoul gateways installed on this site (defaults to 1). */
    gatewayCount: { type: Number, default: 1, min: 0 },
    gateways: {
      type: [
        new Schema(
          {
            serialNumber: {
              type: String,
              required: true,
              trim: true,
              maxlength: 120,
            },
            label: { type: String, default: "", trim: true, maxlength: 120 },
            source: {
              type: String,
              enum: ["qr", "manual"],
              default: "manual",
            },
            pairedAt: { type: Date, default: Date.now },
            payload: { type: Schema.Types.Mixed, default: null },
            sessions: {
              type: [
                new Schema(
                  {
                    date: { type: String, required: true },
                    time: { type: String, required: true },
                    grams: { type: Number, default: 0 },
                    hiveId: { type: String, default: null },
                  },
                  { _id: true, timestamps: true }
                ),
              ],
              default: [],
            },
          },
          { _id: true, timestamps: false }
        ),
      ],
      default: [],
    },
    /**
     * Ruches on this ferme that currently need attention (alerts).
     * Updated by device telemetry later; seeded manually for now.
     */
    ruchesAttention: { type: Number, default: 0, min: 0 },
    /**
     * Individual ruches living on this ferme. Optional; legacy fermes may
     * have an empty array and only expose aggregate counts. When populated,
     * `rucheCount`/`ruchesAttention` should be derived from this list.
     */
    ruches: { type: [RucheSchema], default: [] },
  },
  { _id: true, timestamps: false }
);

/**
 * Domain entity for a beekeeper ("apiculteur") in the Nahoul network.
 * Independent of the User model — apiculteurs may or may not have a
 * login account; this collection tracks subscription state, hive count
 * and contact details surfaced in "Gestion d'abonnements".
 */
const ApiculteurSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 200,
    },
    phone: { type: String, default: "", trim: true, maxlength: 32 },
    avatarSrc: { type: String, default: "" },
    /**
     * Civil gender — "male" / "female". Optional (older records may have
     * "unknown") and surfaced as its own column on the Gestion d'abonnements
     * table. Future filters can group on it.
     */
    gender: {
      type: String,
      enum: ["male", "female", "unknown"],
      default: "unknown",
    },
    /** Free-form region label (Tunis, Sfax, …). */
    region: { type: String, default: "", trim: true, maxlength: 80 },
    /** Total hives owned by this apiculteur. */
    rucheCount: { type: Number, default: 0, min: 0 },
    /** Number of farms / apiary sites. */
    fermeCount: { type: Number, default: 0, min: 0 },
    /** Subscription state — drives the StatusBadge and the map dot color. */
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "suspended"],
      default: "active",
    },
    /**
     * Length of the current subscription cycle, expressed in months.
     * Drives the automatic `subscriptionEndsAt` calculation.
     */
    subscriptionPeriodMonths: { type: Number, default: 1, min: 1, max: 60 },
    /** When the current active cycle started. */
    subscriptionStartedAt: { type: Date, default: null },
    /** Date the subscription expires (or expired). */
    subscriptionEndsAt: { type: Date, default: null },
    /**
     * When the account was last suspended (clock pause). `null` while
     * the apiculteur is not in the suspended state.
     */
    subscriptionSuspendedAt: { type: Date, default: null },
    /**
     * Remaining time on the subscription at the moment of suspension,
     * in milliseconds. Restored to `subscriptionEndsAt` when re-activated.
     */
    subscriptionRemainingMs: { type: Number, default: 0, min: 0 },
    /** Geographic coordinates for the répartitions map. */
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    /** Postal address used as the marker label in the detail map. */
    address: { type: String, default: "", trim: true, maxlength: 240 },
    /** List of fermes / apiary sites belonging to this apiculteur. */
    fermes: { type: [FermeSchema], default: [] },
    /**
     * Optional link to the matching `User` account (used to sign in).
     * Filled when the apiculteur is created through the admin form;
     * legacy / seeded records may leave this empty.
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

ApiculteurSchema.index({ subscriptionStatus: 1, createdAt: -1 });

export type ApiculteurDocument = InferSchemaType<typeof ApiculteurSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Apiculteur: Model<ApiculteurDocument> =
  (mongoose.models.Apiculteur as Model<ApiculteurDocument>) ||
  mongoose.model<ApiculteurDocument>("Apiculteur", ApiculteurSchema);
