import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash?: string;
  googleId?: string;
  role: "user" | "admin" | "editor";
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true, 
      lowercase: true, 
      trim: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    passwordHash: { 
      type: String 
    },
    googleId: { 
      type: String, 
      unique: true, 
      sparse: true, 
      index: true 
    },
    role: { 
      type: String, 
      enum: ["user", "admin", "editor"], 
      default: "user" 
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    avatarUrl: { 
      type: String 
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compiling model in Next.js development server hot-reloads
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
