import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnonymousUsage extends Document {
  visitorId: string;
  count: number;
  ips: string[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnonymousUsageSchema: Schema<IAnonymousUsage> = new Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
    },
    ips: {
      type: [String],
      default: [],
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

// Optional: Expire usage locks automatically after 24 hours to reset free count limits
// To keep it simple and permanent, set standard expiration or TTL indices
AnonymousUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AnonymousUsage: Model<IAnonymousUsage> =
  mongoose.models.AnonymousUsage ||
  mongoose.model<IAnonymousUsage>("AnonymousUsage", AnonymousUsageSchema);

export default AnonymousUsage;
