# CodingCON Backend

Express + Socket.IO backend for the CIT coding assessment platform.
Handles authentication, problem management, contest management, code execution (judge), leaderboards, and real-time verdict streaming.

---

## Test Results

All 102 unit tests pass (judge/compiler pipeline). Run with:

```bash
npm test              # run full suite
npm test -- --watch  # watch mode
```

**Test coverage:**
- `runner.test.ts` (29 tests): Python, JavaScript, C++, Java execution, compile errors, timeouts, cleanup
- `worker-normalise.test.ts` (47 tests): output normalisation, verdict decision logic, judge loop simulation
- `submissions-normalise.test.ts` (26 tests): submissions normalise contract, divergence documentation

All 87 integration tests pass. Run them yourself with:

```bash
npm run dev          # terminal 1 — start backend
python scripts/test_all.py   # terminal 2 — run suite
```

```
 1. HEALTH CHECK                        2/2   ✓
 2. AUTH — Register                     5/5   ✓
 3. AUTH — Login                        8/8   ✓
 4. AUTH — /me                          3/3   ✓
 5. PROBLEMS — List                     8/8   ✓
 6. PROBLEMS — Single                   7/7   ✓
 7. PROBLEMS — Create (admin only)      3/3   ✓
 8. PROBLEMS — Update & Delete          4/4   ✓
 9. CONTESTS                            9/9   ✓
10. ANNOUNCEMENTS                       3/3   ✓
11. LEADERBOARD                         4/4   ✓
12. PROFILE                             5/5   ✓
13. SUBMISSIONS — List                  2/2   ✓
14. JUDGE — Python AC (Two Sum)         8/8   ✓
15. JUDGE — Wrong Answer                2/2   ✓
16. JUDGE — Runtime Error               1/1   ✓
17. JUDGE — JavaScript AC (BinSearch)   2/2   ✓
18. JUDGE — Run mode (samples only)     3/3   ✓
19. LEADERBOARD — Updated after AC      3/3   ✓
20. SUBMISSIONS HISTORY                 3/3   ✓
21. AUTH — Logout                       2/2   ✓
─────────────────────────────────────────────
    Total: 87/87 passed  — all green ✓
```

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24+ (built-in `node:sqlite`) |
| Framework | Express 4 |
| Database | SQLite via `node:sqlite` (no native build needed) |
| Auth | JWT (httpOnly cookie) + bcryptjs |
| Real-time | Socket.IO 4 |
| Code Judge | Native subprocess (dev) / Docker (prod) |
| Language | TypeScript 5 |

> **No native compilation required.** Uses Node 24's built-in `node:sqlite` — works on Windows, macOS, and Linux without Visual C++ or node-gyp.

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Edit `backend/.env` as needed:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP port |
| `JWT_SECRET` | `codingcon_super_secret_jwt_key_change_in_prod` | **Change in production** |
| `DB_PATH` | `./data/codingcon.db` | SQLite file path |
| `JUDGE_USE_DOCKER` | `false` | `true` = Docker sandboxing, `false` = native subprocess |
| `JUDGE_TIMEOUT_MS` | `10000` | Hard kill timeout per test case (ms) |
| `JUDGE_MEMORY_MB` | `256` | Memory cap (Docker mode only) |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |

### 3. Seed the database

Creates schema + 6 problems + contest `c88` + 3 default accounts:

```bash
npm run seed
```

| Email | Password | Role |
|---|---|---|
| `admin@cit.edu` | `admin123` | admin |
| `faculty@cit.edu` | `faculty123` | problem_setter |
| `student@cit.edu` | `student123` | student |

### 4. Start

```bash
# Development (hot-reload)
npm run dev

# Production build
npm run build && npm start
```

Server starts on `http://localhost:4000`.

### 5. Reset and re-seed

```bash
npm run db:reset
npm run seed
```

---

## API Reference

All routes are prefixed with `/api`. All protected routes require a valid `token` cookie (set automatically on login).

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register (returns user + sets cookie) |
| POST | `/auth/login` | — | Login (returns user + sets cookie) |
| POST | `/auth/logout` | — | Clear cookie |
| GET | `/auth/me` | ✓ | Current user profile |

**Register body:**
```json
{ "email": "user@cit.edu", "username": "user", "password": "pass123" }
```

**Login response:**
```json
{
  "id": "uuid", "username": "TestStudent", "email": "student@cit.edu",
  "role": "student", "rating": 1500, "maxRating": 1500,
  "solvedCount": 0, "streakDays": 0, "ratingHistory": []
}
```

**Error codes:** `400` missing fields / short password · `401` wrong credentials · `409` duplicate email/username

---

### Problems

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/problems` | ✓ | List all active problems |
| GET | `/problems?difficulty=easy` | ✓ | Filter by difficulty (`easy`/`medium`/`hard`) |
| GET | `/problems?q=sum` | ✓ | Search by title or tag |
| GET | `/problems/:id` | ✓ | Get by ID or slug — includes sample test cases + per-user solved status |
| POST | `/problems` | admin/setter | Create problem with test cases |
| PATCH | `/problems/:id` | admin/setter | Update any field |
| DELETE | `/problems/:id` | admin/setter | Soft-delete (marks inactive) |

**Problem response fields:**
```
id, title, slug, difficulty, points, timeLimitMs, memoryLimitMb,
acceptanceRate, totalSubmissions, description, inputFormat, outputFormat,
tags[], isSolved, isAttempted, sampleTestCases[]
```

**Seeded problems:**

| # | Title | Difficulty | Points | Test Cases |
|---|---|---|---|---|
| 1 | Two Sum | Easy | 100 | 5 (2 sample + 3 hidden) |
| 2 | Valid Parentheses | Easy | 100 | 6 (3 sample + 3 hidden) |
| 3 | Binary Search | Easy | 100 | 5 (2 sample + 3 hidden) |
| 4 | Maximum Subarray | Medium | 200 | 5 (3 sample + 2 hidden) |
| 5 | Longest Common Subsequence | Medium | 200 | 5 (3 sample + 2 hidden) |
| 6 | Merge K Sorted Lists | Hard | 300 | 4 (2 sample + 2 hidden) |

---

### Contests

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/contest/active` | ✓ | Most recently started contest |
| GET | `/contest/:id` | ✓ | Contest by ID (auto-registers participant on first visit) |
| POST | `/contest` | admin/setter | Create contest |
| POST | `/contest/:id/announcements` | admin/setter | Broadcast announcement (also emits via Socket.IO) |
| PATCH | `/contest/:id/freeze` | admin | Freeze/unfreeze leaderboard |

**Contest response fields:**
```
id, title, startTime, endTime, durationMinutes, participantCount,
maxScore, isLeaderboardFrozen, problems[], announcements[]
```

---

### Leaderboard

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/leaderboard/:contestId` | ✓ | Ranked standings — ICPC penalty scoring |
| POST | `/leaderboard/:contestId/recalculate` | admin | Force rebuild from submissions |

**Entry fields:**
```
rank, userId, username, solvedCount, totalScore,
penaltyTimeMinutes, problemBreakdown{}
```

Scoring: `totalScore = sum of solved problem points`. Tie-break: lower `penaltyTimeMinutes`. Penalty = `minutesSinceStart + wrongAttempts × 20`.

---

### Submissions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/submissions` | ✓ | Submit code — returns `202` immediately, judge runs async |
| GET | `/submissions` | ✓ | Current user's last 50 submissions |
| GET | `/submissions/:id` | ✓ | Single submission with per-test-case results |

**Submit body:**
```json
{
  "problemId": "uuid",
  "language": "python",
  "code": "...",
  "isSubmit": true,
  "contestId": "c88"
}
```

- `isSubmit: false` — Run mode: only runs **sample test cases** (fast feedback)
- `isSubmit: true` — Submit mode: runs **all test cases** (counts for leaderboard)

**Submit response (202):**
```json
{ "id": "submission-uuid", "totalTestCases": 5 }
```

Real-time progress arrives via Socket.IO. Poll `GET /submissions/:id` for final result.

**Verdict codes:**

| Code | Meaning |
|---|---|
| `AC` | Accepted — all test cases passed |
| `WA` | Wrong Answer — output mismatch |
| `TLE` | Time Limit Exceeded |
| `RE` | Runtime Error — non-zero exit or crash |
| `MLE` | Memory Limit Exceeded (Docker mode only) |

---

### Profile

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile` | ✓ | Current user with rating history |

---

## Code Judge

### Supported Languages

| Language | Runtime needed | Input method |
|---|---|---|
| Python | `python3` | `input()` / `sys.stdin` |
| JavaScript | `node` | `process.stdin` events |
| C++ | `g++` (MinGW on Windows) | `cin` |
| Java | `javac` + `java` | `Scanner` / `BufferedReader` |

### Recent Fixes (v2.1)

All four compilers now work reliably on Windows and Linux:

- **Python**: Fixed stdin pipe hang on Windows Node v24+ by using `fs.createReadStream` instead of direct `child.stdin.write()`
- **JavaScript**: Fixed infinite block when spawning node-from-node by redirecting stdin via file stream
- **C++**: Fixed compile command being called twice, generating inconsistent output paths. Now builds args once.
- **Java**: Fixed UTF-8 BOM being written to source files, breaking `javac` with "illegal character: '\ufeff'". Files now use `Buffer.from(content, 'utf8')`.

**New `/api/run` endpoint:** Custom Input panel now actually runs code in real-time instead of returning a mock. Returns `{ stdout, stderr, executionTimeMs, exitCode, timedOut }`.

**Unified normalise():** Output comparison logic consolidated into `src/judge/normalise.ts` — worker and submissions routes now use the same function for consistent verdicts.

### Native mode (default — `JUDGE_USE_DOCKER=false`)

Runs code as a local child process. Stdin is piped directly from the test case input.

**Windows note:** Node.js and Python spawn overhead (~400–600ms) is automatically subtracted from the measured execution time before comparing against the problem's time limit. The wall-clock time stored in the DB is the real elapsed time.

### Docker mode (`JUDGE_USE_DOCKER=true`)

Each test case runs inside an isolated container:
- No network (`--network none`)
- Memory cap (`--memory`)
- CPU limit (`--cpus 0.5`)
- Read-only source volume

Requires Docker Desktop or Docker Engine running.

---

## Socket.IO Events

Connect to `ws://localhost:4000` (or through the Next.js `/socket.io/*` proxy).

### Client → Server (emit)

| Event | Payload | Description |
|---|---|---|
| `subscribe:submission` | `submissionId: string` | Stream judge progress for a submission |
| `subscribe:leaderboard` | `contestId: string` | Stream live leaderboard updates |
| `subscribe:contest` | `contestId: string` | Stream contest announcements |

### Server → Client (listen)

| Event | When | Key payload fields |
|---|---|---|
| `submission:progress` | After each test case | `passedTestCases`, `totalTestCases`, `testCaseResult`, `isStreaming: true` |
| `submission:done` | Judge finished | `verdict`, `passedTestCases`, `totalTestCases`, `executionTimeMs`, `failedTestCase` |
| `leaderboard:update` | After every AC contest submission | `LeaderboardEntry[]` |
| `announcement` | Admin posts announcement | `{ id, message, timestamp }` |

---

## Database Schema

10 tables in SQLite (WAL mode, foreign keys enabled):

| Table | Description |
|---|---|
| `users` | Accounts with role, rating, solvedCount |
| `rating_history` | Per-contest rating snapshots |
| `problems` | Problem metadata + soft-delete flag |
| `test_cases` | Sample + hidden test cases per problem |
| `contests` | Contest windows + freeze flag |
| `contest_problems` | Many-to-many problem↔contest |
| `announcements` | Admin broadcasts per contest |
| `submissions` | One row per code run with final verdict |
| `submission_results` | Per-test-case results for each submission |
| `leaderboard` | Materialised standings, rebuilt on each AC |

---

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── database.ts      # node:sqlite connection + schema init
│   │   ├── types.ts         # DB row interfaces
│   │   └── utils.ts         # Type-cast helpers for node:sqlite output
│   ├── middleware/
│   │   └── auth.ts          # JWT verify, requireAuth, requireRole
│   ├── judge/
│   │   └── runner.ts        # Native subprocess + Docker execution engine
│   ├── routes/
│   │   ├── auth.ts          # Register / login / logout / me
│   │   ├── problems.ts      # CRUD + per-user status
│   │   ├── contests.ts      # Contest fetch + announcements + freeze
│   │   ├── leaderboard.ts   # ICPC scoring + recalculate
│   │   ├── submissions.ts   # Submit → async judge → socket events
│   │   └── profile.ts       # User profile + rating history
│   ├── socket/
│   │   └── gateway.ts       # Socket.IO server + room subscriptions
│   └── index.ts             # Express app + HTTP server entry point
├── scripts/
│   ├── seed.ts              # Populate DB with demo data
│   ├── reset.ts             # Wipe DB file
│   ├── test_all.py          # Integration test suite (87 tests)
│   └── diagnose.py          # Quick judge diagnostics
├── data/                    # SQLite files (git-ignored)
├── .env                     # Environment variables
├── package.json
└── tsconfig.json
```

---

## Running the Full Stack

```bash
# Terminal 1 — backend (port 4000)
cd backend
npm install
npm run seed    # first time only
npm run dev

# Terminal 2 — frontend (port 3000)
cd ..           # back to project root
npm install
npm run dev
```

Open `http://localhost:3000`. The Next.js proxy rewrites all `/api/*` and `/socket.io/*` requests to the backend automatically — no CORS issues.
