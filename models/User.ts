import mongoose, { Schema, Model, InferSchemaType } from "mongoose";
import { ROLES } from "@/lib/auth/roles";

/**
 * Single User collection holding all roles (super-admin / admin / apiculteur).
 * Specific profile fields can be added later as optional sub-documents
 * (e.g. `apiculteurProfile`, `adminProfile`) or as references to dedicated
 * collections, without breaking the role-based auth model.
 */
const UserSchema = new Schema(
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
    /** Bcrypt hash. Never store plaintext passwords. */
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
      default: "apiculteur",
    },
    avatarSrc: { type: String, default: "" },
    /** International phone number including the country prefix. */
    phone: { type: String, default: "", trim: true, maxlength: 32 },
    /** User's gender/genre */
    genre: { type: String, default: "" },
    /** For admins: optional region scope. For apiculteurs: their location. */
    region: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    /**
     * Timestamp of the most recent successful login. Used by the
     * super-admin dashboard ("Admins connectés" card) to show who
     * was active recently. Never displayed for failed attempts.
     */
    lastLoginAt: { type: Date, default: null },
    /**
     * Continuously updated by the client-side heartbeat (POST
     * /api/auth/heartbeat) while the user has the app open. We treat
     * the user as **online** when this is within the configured
     * presence window (~90s). Cleared on explicit logout.
     */
    lastActiveAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// email already has a unique index via the field-level `unique: true`.
UserSchema.index({ role: 1 });

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", UserSchema);
