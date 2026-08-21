import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const AlertSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hiveId: { type: String, required: true },
    hiveName: { type: String, required: true },
    farmName: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, enum: ["Resolue", "En cours", "Non resolue"], default: "Non resolue" },
    tone: { type: String, enum: ["orange", "red", "purple"], default: "orange" },
    category: { type: String, enum: ["batterie", "capteur", "venin", "autre"], default: "autre" },
    date: { type: String, default: null },
    time: { type: String, default: null },
  },
  { timestamps: true }
);

AlertSchema.index({ userId: 1, createdAt: -1 });
AlertSchema.index({ userId: 1, status: 1 });

export type AlertDocument = InferSchemaType<typeof AlertSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Alert: Model<AlertDocument> =
  (mongoose.models.Alert as Model<AlertDocument>) ||
  mongoose.model<AlertDocument>("Alert", AlertSchema);
