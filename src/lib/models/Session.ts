import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  replacedByTokenHash?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

const SessionSchema: Schema<ISession> = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    tokenHash: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    expiresAt: { 
      type: Date, 
      required: true, 
      index: true 
    },
    isRevoked: { 
      type: Boolean, 
      default: false 
    },
    replacedByTokenHash: { 
      type: String 
    },
    userAgent: { 
      type: String 
    },
    ipAddress: { 
      type: String 
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// MongoDB TTL index to automatically purge expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
export default Session;
