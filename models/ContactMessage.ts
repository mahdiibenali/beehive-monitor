import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

/**
 * A message submitted from the public `/contact` form.
 *
 * Anyone (signed-in or not) can create one. Only super-admin and admin
 * can read / triage them from `/messages-contact`. Replies happen via
 * email — we just track the read / handled state in-app.
 */
const ContactMessageSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Le prénom est requis."],
      trim: true,
      maxlength: 80,
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis."],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "L'email est requis."],
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, "Le message est requis."],
      trim: true,
      maxlength: 4000,
    },
    /**
     * Triage state.
     *   • `new`      — never opened
     *   • `read`     — at least one admin viewed it
     *   • `handled`  — responded to / closed
     */
    status: {
      type: String,
      enum: ["new", "read", "handled"],
      default: "new",
      index: true,
    },
    handledBy: {
      id: { type: Schema.Types.ObjectId, ref: "User", default: null },
      name: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    handledAt: { type: Date, default: null },
    /** Capture origin so admins can spot spam waves later. */
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

export type ContactMessageDocument = InferSchemaType<
  typeof ContactMessageSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const ContactMessage: Model<ContactMessageDocument> =
  (mongoose.models.ContactMessage as Model<ContactMessageDocument>) ||
  mongoose.model<ContactMessageDocument>(
    "ContactMessage",
    ContactMessageSchema
  );
