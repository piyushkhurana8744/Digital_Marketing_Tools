import mongoose from "mongoose";

// Global cache object to hold database connection across hot updates in development
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || "";

  if (!MONGODB_URI && process.env.NODE_ENV === "production") {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.production / .env.local");
  }

  // If connection is cached, return it directly
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection promise is not yet established, initialize mongoose connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const uri = MONGODB_URI || "mongodb://localhost:27017/digitools_ai";
    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
