import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const TelemetrySchema = new Schema(
  {
    gatewayId: { type: String, required: true, index: true },
    hiveId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

TelemetrySchema.index({ gatewayId: 1, timestamp: -1 });
TelemetrySchema.index({ hiveId: 1, timestamp: -1 });

export type TelemetryDocument = InferSchemaType<typeof TelemetrySchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Telemetry: Model<TelemetryDocument> =
  (mongoose.models.Telemetry as Model<TelemetryDocument>) ||
  mongoose.model<TelemetryDocument>("Telemetry", TelemetrySchema);
