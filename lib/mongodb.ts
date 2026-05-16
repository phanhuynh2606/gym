import mongoose, { type Mongoose } from "mongoose";

type Cache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  var __mongoose: Cache | undefined;
}

const cached: Cache = global.__mongoose ?? { conn: null, promise: null };

if (!global.__mongoose) {
  global.__mongoose = cached;
}

export async function connectMongoDB(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Add it to your .env.local based on .env.example.",
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}
