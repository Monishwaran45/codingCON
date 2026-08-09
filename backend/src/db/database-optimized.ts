/**
 * Optimized MongoDB Connection for Production
 * Includes connection pooling, retry logic, and monitoring
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { performanceConfig } from '../config/performance';

// Load .env file explicitly
const envPath = path.resolve(__dirname, '../../.env');
console.log(`[DEBUG] Loading .env from: ${envPath}`);
const envConfig = dotenv.config({ path: envPath });
console.log(`[DEBUG] .env loaded:`, envConfig.error ? `ERROR: ${envConfig.error}` : `OK (${Object.keys(envConfig.parsed || {}).length} vars)`);
console.log(`[DEBUG] MONGODB_URI from env: ${process.env.MONGODB_URI?.substring(0, 50)}...`);

let connectionAttempts = 0;
const MAX_RETRIES = 3;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    console.log(`✓ Using existing MongoDB connection (state: ${mongoose.connection.readyState})`);
    return mongoose;
  }

  let conn: typeof mongoose;
  const primaryUri = process.env.MONGODB_URI;
  
  const dockerUris = [
    'mongodb://127.0.0.1:27017/codingcon',
    'mongodb://mongodb:27017/codingcon',
    'mongodb://localhost:27017/codingcon',
  ];

  const mongooseOptions = {
    maxPoolSize: performanceConfig.mongoose.maxPoolSize,
    minPoolSize: performanceConfig.mongoose.minPoolSize,
    socketTimeoutMS: performanceConfig.mongoose.socketTimeoutMS,
    serverSelectionTimeoutMS: performanceConfig.mongoose.serverSelectionTimeoutMS,
    retryWrites: true,
    retryReads: true,
    family: 4,
  } as any;

  // Try primary MongoDB (Cloud Atlas / API key)
  if (primaryUri) {
    connectionAttempts = 0;
    while (connectionAttempts < MAX_RETRIES) {
      try {
        connectionAttempts++;
        console.log(`🔌 Connecting to Primary MongoDB (Attempt ${connectionAttempts}/${MAX_RETRIES})...`);
        conn = await mongoose.connect(primaryUri, mongooseOptions);
        console.log(`✓ Connected to Primary MongoDB: ${conn.connection.host}/${conn.connection.name}`);
        console.log(`   Pool Size: ${performanceConfig.mongoose.minPoolSize}-${performanceConfig.mongoose.maxPoolSize}`);
        setupConnectionMonitoring(conn);
        return conn;
      } catch (err: any) {
        if (connectionAttempts >= MAX_RETRIES) {
          console.warn(`⚠️ Primary MongoDB connection failed after ${MAX_RETRIES} attempts`);
          console.warn(`🔄 Falling back to Docker MongoDB...`);
          break;
        }
        console.warn(`⚠️  Connection attempt ${connectionAttempts} failed: ${err?.message || err}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * connectionAttempts));
      }
    }
  }

  // Try Local / Docker MongoDB URIs
  for (const dockerUri of dockerUris) {
    if (dockerUri === primaryUri) continue;
    try {
      console.log(`🔌 Trying Docker MongoDB: ${dockerUri}...`);
      conn = await mongoose.connect(dockerUri, mongooseOptions);
      console.log(`✓ Connected to Docker MongoDB: ${conn.connection.host}/${conn.connection.name}`);
      console.log(`   Pool Size: ${performanceConfig.mongoose.minPoolSize}-${performanceConfig.mongoose.maxPoolSize}`);
      setupConnectionMonitoring(conn);
      return conn;
    } catch (err: any) {
      console.warn(`⚠️  Docker URI failed: ${err?.message?.substring(0, 50) || err}`);
    }
  }

  // Fallback to in-memory MongoDB
  console.warn(`⚠️  Using fallback In-Memory MongoDB...`);
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    conn = await mongoose.connect(uri, mongooseOptions);
    console.log(`✓ Connected to In-Memory MongoDB Server (${uri})`);
    setupConnectionMonitoring(conn);
    return conn;
  } catch (fallbackErr) {
    console.error('❌ Failed to start fallback In-Memory MongoDB:', fallbackErr);
    throw fallbackErr;
  }
}

function setupConnectionMonitoring(conn: typeof mongoose): void {
  const db = conn.connection;

  db.on('connected', () => {
    console.log(`✓ MongoDB connected event`);
  });

  db.on('error', (err) => {
    console.error(`❌ MongoDB error:`, err);
  });

  db.on('disconnected', () => {
    console.warn(`⚠️  MongoDB disconnected`);
  });

  db.on('reconnected', () => {
    console.log(`✓ MongoDB reconnected`);
  });
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState > 0) {
    await mongoose.disconnect();
    console.log(`✓ MongoDB disconnected gracefully`);
  }
}

export default mongoose;
