import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { connectDB } from '../src/db/database';
import { User } from '../src/db/models/User';
import { Submission } from '../src/db/models/Submission';
import { Leaderboard } from '../src/db/models/Leaderboard';
import { RatingHistory } from '../src/db/models/RatingHistory';
import { Role } from '../src/db/models/Role';
import { Announcement } from '../src/db/models/Announcement';
import { Problem } from '../src/db/models/Problem';
import { Contest } from '../src/db/models/Contest';

async function resetDB() {
  await connectDB();
  const isFull = process.argv.includes('--full');

  console.log('\n🧹 Clearing database data …');

  // 1. Wipe Submissions, Leaderboards, RatingHistory
  const subRes = await Submission.deleteMany({});
  console.log(`  ✓ Deleted ${subRes.deletedCount} submissions`);

  const lbRes = await Leaderboard.deleteMany({});
  console.log(`  ✓ Deleted ${lbRes.deletedCount} leaderboard entries`);

  const rhRes = await RatingHistory.deleteMany({});
  console.log(`  ✓ Deleted ${rhRes.deletedCount} rating history records`);

  if (isFull) {
    const annRes = await Announcement.deleteMany({});
    console.log(`  ✓ Deleted ${annRes.deletedCount} announcements`);

    const contestRes = await Contest.deleteMany({});
    console.log(`  ✓ Deleted ${contestRes.deletedCount} contests`);

    const probRes = await Problem.deleteMany({});
    console.log(`  ✓ Deleted ${probRes.deletedCount} problems`);
  }

  // 2. Clear all users
  const userRes = await User.deleteMany({});
  console.log(`  ✓ Deleted ${userRes.deletedCount} user accounts`);

  // 3. Ensure Roles exist
  await Role.deleteMany({});
  await Role.create([
    { name: 'admin', permissions: ['manage_problems', 'manage_contests', 'manage_users', 'all'] },
    { name: 'problem_setter', permissions: ['manage_problems', 'create_problem'] },
    { name: 'student', permissions: ['solve_problems'] },
  ]);
  console.log('  ✓ Roles initialized');

  // 4. Create single clean Admin user
  const adminId = uuid();
  await User.create({
    _id: adminId,
    username: 'Admin',
    email: 'admin@cit.edu',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    totalPoints: 0,
    solvedCount: 0,
    streakDays: 0,
    rating: 1500,
    maxRating: 1500,
  });
  console.log('  ✓ Default Admin user recreated (admin@cit.edu / admin123)');

  console.log('\n✅ Database reset complete! System is ready for real use.\n');
  process.exit(0);
}

resetDB().catch((err) => {
  console.error('Reset error:', err);
  process.exit(1);
});

