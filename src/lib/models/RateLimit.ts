import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRateLimit extends Document {
  key: string;
  count: number;
  expiresAt: Date;
}

const RateLimitSchema: Schema<IRateLimit> = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      required: true,
      default: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-purge expired documents using MongoDB TTL index
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit || mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);

export default RateLimit;
