import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversionLog extends Document {
  userId?: mongoose.Types.ObjectId;
  visitorId?: string;
  toolSlug: string;
  status: "pending" | "processing" | "completed" | "failed";
  inputFileName: string;
  inputFileSize: number;
  outputFileName?: string;
  outputFileSize?: number;
  creditsUsed: number;
  errorDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionLogSchema: Schema<IConversionLog> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    visitorId: {
      type: String,
      index: true,
    },
    toolSlug: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      required: true,
    },
    inputFileName: {
      type: String,
      required: true,
    },
    inputFileSize: {
      type: Number,
      required: true,
    },
    outputFileName: {
      type: String,
    },
    outputFileSize: {
      type: Number,
    },
    creditsUsed: {
      type: Number,
      required: true,
      default: 0,
    },
    errorDetails: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compiling in hot-reload
export const ConversionLog: Model<IConversionLog> =
  mongoose.models.ConversionLog ||
  mongoose.model<IConversionLog>("ConversionLog", ConversionLogSchema);

export default ConversionLog;
