import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/codingcon.db';
const resolved = path.resolve(DB_PATH);

for (const ext of ['', '-shm', '-wal']) {
  const f = resolved + ext;
  if (fs.existsSync(f)) { fs.unlinkSync(f); console.log('Deleted', f); }
}
console.log('✅  DB reset. Run `npm run seed` to re-seed.');
