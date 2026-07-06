import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedFile extends Document {
  userId: mongoose.Types.ObjectId;
  toolSlug: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string; // Base64 buffer stream link
  createdAt: Date;
  updatedAt: Date;
}

const SavedFileSchema: Schema<ISavedFile> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toolSlug: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    downloadUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SavedFile: Model<ISavedFile> =
  mongoose.models.SavedFile ||
  mongoose.model<ISavedFile>("SavedFile", SavedFileSchema);

export default SavedFile;
