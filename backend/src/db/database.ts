import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

dotenv.config();

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  let conn: typeof mongoose;

  const primaryUri = process.env.MONGODB_URI;
  const dockerUris = [
    'mongodb://127.0.0.1:27017/codingcon',
    'mongodb://mongodb:27017/codingcon',
    'mongodb://localhost:27017/codingcon',
  ];

  // 1. Try Primary Cloud Atlas / API key MONGODB_URI if provided
  if (primaryUri) {
    try {
      console.log(`🔌 Connecting to Primary MongoDB (Cloud / API Key)...`);
      conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✓ Connected to Primary MongoDB: ${conn.connection.host}/${conn.connection.name}`);
      await ensureSeedData();
      return conn;
    } catch (err: any) {
      console.warn(`⚠️ Primary MongoDB connection failed (${err?.message || err}).`);
      console.warn(`🔄 Falling back to Docker MongoDB...`);
    }
  }

  // 2. Try Local / Docker MongoDB URIs
  for (const dockerUri of dockerUris) {
    if (dockerUri === primaryUri) continue;
    try {
      conn = await mongoose.connect(dockerUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`✓ Connected to Docker MongoDB: ${conn.connection.host}/${conn.connection.name} (${dockerUri})`);
      await ensureSeedData();
      return conn;
    } catch {
      // try next docker URI
    }
  }

  // 3. Safety Fallback: In-Memory MongoDB Server
  console.warn(`⚠️ Docker MongoDB unavailable. Starting fallback In-Memory MongoDB...`);
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    conn = await mongoose.connect(uri);
    console.log(`✓ Connected to In-Memory MongoDB Server (${uri})`);
    await ensureSeedData();
    return conn;
  } catch (fallbackErr) {
    console.error('❌ Failed to start fallback In-Memory MongoDB:', fallbackErr);
    throw fallbackErr;
  }
}

async function ensureSeedData() {
  const { User } = await import('./models/User');
  const { Role } = await import('./models/Role');
  const { Problem } = await import('./models/Problem');
  const { Contest } = await import('./models/Contest');
  const { Announcement } = await import('./models/Announcement');

  const count = await User.countDocuments();
  if (count > 0) return;

  console.log('── Auto-seeding initial database collections …');

  const roleCount = await Role.countDocuments();
  if (roleCount === 0) {
    await Role.create([
      { name: 'admin', permissions: ['manage_problems', 'manage_contests', 'manage_users'] },
      { name: 'problem_setter', permissions: ['manage_problems'] },
      { name: 'student', permissions: ['solve_problems'] },
    ]);
  }

  const adminId = uuid();
  await User.create([
    {
      _id: adminId,
      username: 'Admin',
      email: 'admin@cit.edu',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      totalPoints: 0,
    },
    {
      _id: uuid(),
      username: 'Faculty',
      email: 'faculty@cit.edu',
      passwordHash: bcrypt.hashSync('faculty123', 10),
      role: 'problem_setter',
      totalPoints: 0,
    },
    {
      _id: uuid(),
      username: 'TestStudent',
      email: 'student@cit.edu',
      passwordHash: bcrypt.hashSync('student123', 10),
      role: 'student',
      totalPoints: 0,
    },
  ]);

  const p1 = uuid();
  const p2 = uuid();
  const p3 = uuid();
  const p4 = uuid();

  await Problem.create([
    {
      _id: p1,
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'easy',
      points: 100,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
      inputFormat: 'First line: integer N\nSecond line: N space-separated integers\nThird line: integer target',
      outputFormat: 'Two space-separated indices i and j (0-indexed) such that nums[i]+nums[j]==target',
      tags: ['Arrays', 'Hash Map'],
      createdBy: adminId,
      testCases: [
        { id: uuid(), input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isSample: true, sortOrder: 0 },
        { id: uuid(), input: '3\n3 2 4\n6', expectedOutput: '1 2', isSample: true, sortOrder: 1 },
        { id: uuid(), input: '2\n3 3\n6', expectedOutput: '0 1', isSample: false, sortOrder: 2 },
      ],
    },
    {
      _id: p2,
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      difficulty: 'easy',
      points: 100,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.',
      inputFormat: 'A single line string s',
      outputFormat: 'Print "true" if valid, "false" otherwise',
      tags: ['Strings', 'Stack'],
      createdBy: adminId,
      testCases: [
        { id: uuid(), input: '()', expectedOutput: 'true', isSample: true, sortOrder: 0 },
        { id: uuid(), input: '(]', expectedOutput: 'false', isSample: true, sortOrder: 1 },
      ],
    },
    {
      _id: p3,
      title: 'Binary Search',
      slug: 'binary-search',
      difficulty: 'easy',
      points: 100,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      description: 'Given a sorted array of integers `nums` and a target integer, return the index of target. If not found, return -1.',
      inputFormat: 'First line: N\nSecond line: N sorted integers\nThird line: target',
      outputFormat: 'Index of target',
      tags: ['Arrays', 'Searching'],
      createdBy: adminId,
      testCases: [
        { id: uuid(), input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4', isSample: true, sortOrder: 0 },
      ],
    },
    {
      _id: p4,
      title: 'Maximum Subarray',
      slug: 'maximum-subarray',
      difficulty: 'medium',
      points: 200,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      description: 'Given an integer array `nums`, find the contiguous subarray with the largest sum and return its sum.',
      inputFormat: 'First line: N\nSecond line: N space-separated integers',
      outputFormat: 'Integer — maximum subarray sum',
      tags: ['Arrays', 'Dynamic Programming'],
      createdBy: adminId,
      testCases: [
        { id: uuid(), input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isSample: true, sortOrder: 0 },
      ],
    },
  ]);

  const now = new Date();
  const start = new Date(now.getTime() - 30 * 60 * 1000);
  const end = new Date(now.getTime() + 90 * 60 * 1000);

  await Contest.create({
    _id: 'c88',
    title: 'CIT Coding Assessment — Session 1',
    startTime: start,
    endTime: end,
    durationMinutes: 120,
    maxScore: 500,
    createdBy: adminId,
    problemIds: [p1, p2, p3, p4],
  });

  await Announcement.create({
    _id: uuid(),
    contestId: 'c88',
    message: 'Welcome to Session 1. You have 120 minutes. Good luck to all participants.',
    timestamp: new Date(now.getTime() - 20 * 60 * 1000),
  });

  console.log('✓ Initial seed completed successfully');
}

export function initSchema(): void {
  connectDB().catch((err) => {
    console.error('Failed to initialize MongoDB connection:', err);
  });
}

export default mongoose;
