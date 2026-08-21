import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const ItemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export type ItemDocument = InferSchemaType<typeof ItemSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Item: Model<ItemDocument> =
  (mongoose.models.Item as Model<ItemDocument>) ||
  mongoose.model<ItemDocument>("Item", ItemSchema);
