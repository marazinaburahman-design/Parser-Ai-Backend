import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resume_parser';

// Cache the connection so it is reused across serverless invocations.
let cached = globalThis.__mongooseConn;
if (!cached) {
  cached = globalThis.__mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;
  console.log('MongoDB connected');
  return cached.conn;
}
