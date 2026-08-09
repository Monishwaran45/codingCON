/**
 * Performance Configuration for Production
 * Optimized for handling 500+ concurrent users
 */

export const performanceConfig = {
  // Connection Pool Settings
  mongoose: {
    // Max connections for connection pooling
    maxPoolSize: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : 50,
    minPoolSize: process.env.DB_MIN_POOL_SIZE ? parseInt(process.env.DB_MIN_POOL_SIZE, 10) : 10,
    // Keep-alive settings to prevent connection drops
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000,
    socketKeepAliveMS: 30000,
  },

  // Express App Settings
  express: {
    // JSON payload size limit
    jsonLimit: '2mb',
    // URL-encoded payload limit
    urlencodedLimit: '2mb',
    // Enable compression
    compression: true,
  },

  // Rate Limiting Settings
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 15, // attempts
      skipSuccessfulRequests: true,
    },
    submission: {
      windowMs: 60 * 1000, // 1 minute
      max: 5,
      skipSuccessfulRequests: false,
    },
    run: {
      windowMs: 60 * 1000, // 1 minute
      max: 10,
      skipSuccessfulRequests: false,
    },
  },

  // Socket.IO Configuration
  socketIO: {
    // Connection settings
    pingInterval: 25000,
    pingTimeout: 60000,
    // Upgrade timeout
    upgradeTimeout: 10000,
    // Allow transports
    transports: ['websocket', 'polling'],
    // Middleware
    cookie: {
      name: 'io',
      length: 4,
      httpOnly: true,
      path: '/socket.io',
    },
    // Max connections per room
    maxHttpBufferSize: 1e6, // 1MB
  },

  // Response Caching
  cache: {
    // TTL in seconds
    problems: 5 * 60, // 5 minutes
    contests: 2 * 60, // 2 minutes
    leaderboard: 30, // 30 seconds
    user: 60, // 1 minute
  },

  // Concurrency Settings
  concurrency: {
    // Max concurrent judge jobs
    maxJudgeJobs: process.env.MAX_JUDGE_JOBS ? parseInt(process.env.MAX_JUDGE_JOBS, 10) : 4,
    // Queue consumer concurrency
    queueConcurrency: process.env.QUEUE_CONCURRENCY ? parseInt(process.env.QUEUE_CONCURRENCY, 10) : 2,
  },

  // Memory Management
  memory: {
    // Garbage collection settings (in MB)
    heapSizeMin: 64,
    heapSizeMax: 512,
  },
};

// Log configuration on startup
export function logConfig(): void {
  console.log('\n📋 Performance Configuration:');
  console.log(`   DB Pool: ${performanceConfig.mongoose.minPoolSize}-${performanceConfig.mongoose.maxPoolSize}`);
  console.log(`   Socket.IO Ping: ${performanceConfig.socketIO.pingInterval}ms`);
  console.log(`   Judge Jobs: ${performanceConfig.concurrency.maxJudgeJobs}`);
  console.log(`   Queue Concurrency: ${performanceConfig.concurrency.queueConcurrency}\n`);
}
