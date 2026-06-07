import mongoose from 'mongoose'

// Singleton pattern: reuse the connection across Next.js hot-reloads in dev
let cached: {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
} = (global as any).__mongooseCache ?? { conn: null, promise: null }

if (!(global as any).__mongooseCache) {
  (global as any).__mongooseCache = cached
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI env var is not set — fill in .env.local')

  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 5,
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}
