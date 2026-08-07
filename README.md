# CodingCON

CodingCON is a web-based competitive-programming and technical-assessment platform. It provides a Next.js workspace, an Express and Socket.IO API, asynchronous judging, contest leaderboards, and isolated Docker execution for Python, JavaScript, C++, and Java submissions.

## Architecture

```text
Browser
  -> Next.js application (port 3000)
  -> Express API and Socket.IO gateway (port 4000)
  -> RabbitMQ judge queue
  -> Dedicated judge worker with Docker socket access
  -> One restricted Docker container per test case

MongoDB stores users, problems, contests, and submissions.
Redis is available to the deployment for caching and coordination.
```

The production backend is the TypeScript application in `backend/src`. The Python files in `backend/app` are legacy code and are not started by the current Docker image or Compose configuration.

## Features

- Account registration and login using HTTP-only JWT cookies
- Role and permission model for students, problem setters, and administrators
- Problem bank with difficulty, tag, and search filters
- Monaco editor with starter templates for Python, JavaScript, C++, and Java
- Run mode for sample tests, custom-input execution, and full asynchronous submission judging
- Compiler, runtime, wrong-answer, and time-limit verdict reporting
- Real-time progress, contest announcements, and leaderboard updates through Socket.IO
- Contest scoring based on solved-problem points and ICPC-style penalty time
- Administration workflows for problems, contests, announcements, and leaderboard recalculation
- Dark and light themes, command palette navigation, and local editor state

## Technology

| Area | Implementation |
| --- | --- |
| Web application | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Editor | Monaco Editor |
| API | Express 4 and Socket.IO |
| Persistence | MongoDB with Mongoose |
| Messaging | RabbitMQ with an in-memory development fallback |
| Judge | Dedicated Node.js worker and Docker containers |
| Authentication | JWT, bcryptjs, HTTP-only cookies |
| Quality automation | Jest and GitHub Actions |

## Requirements

- Node.js 20 or later
- npm
- Docker Engine or Docker Desktop for judging and Compose deployment
- MongoDB, RabbitMQ, and Redis, or Docker Compose to run them

## Local development

Install the frontend dependencies from the repository root:

```bash
npm install
```

Install the backend dependencies:

```bash
cd backend
npm install
```

Set backend environment variables in `backend/.env`:

```dotenv
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/codingcon
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672/
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGIN=http://localhost:3000
JUDGE_TIMEOUT_MS=10000
JUDGE_MEMORY_MB=256
```

Run the services in separate terminals:

```bash
# Repository root: frontend
npm run dev

# backend/: API and Socket.IO gateway
npm run dev

# backend/: asynchronous judge worker
npm run worker:dev
```

The frontend is available at `http://localhost:3000` and the API at `http://localhost:4000`.

The judge worker requires access to a running Docker Engine. Do not run the API process with Docker-socket access.

## Docker Compose deployment

The Compose configuration is in `backend/docker-compose.yml`. It starts MongoDB, Redis, RabbitMQ, the API, and the judge worker. The Docker socket is mounted only into the worker because it launches the short-lived judge containers.

From `backend/`, provide a high-entropy secret and start the stack:

```bash
JWT_SECRET="replace-with-a-long-random-secret" docker compose up --build
```

Optional configuration:

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | Yes | Signing key for API authentication tokens. Never commit this value. |
| `CORS_ORIGIN` | No | Allowed frontend origin. Defaults to `http://localhost:3000`. |
| `JUDGE_TIMEOUT_MS` | No | Maximum wall-clock execution time per test case. Defaults to 10000. |
| `JUDGE_MEMORY_MB` | No | Docker memory cap per judge container. Defaults to 256. |
| `MONGODB_URI` | No | MongoDB connection string. |
| `RABBITMQ_URL` | No | RabbitMQ connection string. |

For a separately deployed frontend, set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL` to the public backend endpoints before building the Next.js application.

## Judge security model

Each execution uses a disposable language image and applies the following restrictions:

- Network disabled
- Read-only container root filesystem
- Read-only input mount
- Writable, size-limited tmpfs work and temporary directories
- Unprivileged execution user
- Dropped Linux capabilities and no-new-privileges
- CPU, memory, PID, and file-descriptor limits
- One-megabyte process-output buffer limit

The worker is the only service allowed to access the Docker socket. Keep it isolated from the API and do not expose the socket to clients or other application containers.

## API overview

All routes are under `/api`. Protected endpoints accept the HTTP-only `token` cookie or a bearer token.

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Problems | `GET /problems`, `GET /problems/:id`, `POST /problems`, `PATCH /problems/:id`, `DELETE /problems/:id` |
| Contests | `GET /contest`, `GET /contest/active`, `GET /contest/:id`, `POST /contest`, announcements and leaderboard-freeze routes |
| Submissions | `POST /submissions`, `GET /submissions`, `GET /submissions/:id` |
| Custom execution | `POST /run` |
| Leaderboards | `GET /leaderboard`, `GET /leaderboard/:contestId`, `POST /leaderboard/:contestId/recalculate` |
| Profile and roles | `GET /profile`, `GET /roles` |
| Operations | `GET /health` |

`POST /submissions` returns `202 Accepted` and a submission ID. Subscribe to the matching Socket.IO submission room or poll `GET /submissions/:id` for the completed verdict.

## Socket.IO events

Clients can subscribe to these channels:

- `subscribe:submission` for progress and completion of an owned submission
- `subscribe:leaderboard` for contest leaderboard updates
- `subscribe:contest` for contest announcements

The server emits `submission:progress`, `submission:done`, `leaderboard:update`, and `announcement` events.

## Testing and maintenance

Run backend verification from `backend/`:

```bash
npm test
npm run build
```

The GitHub Actions maintenance workflow runs on pushes to `main`, pull requests, manual dispatch, and every Monday. It installs locked dependencies, runs the backend test suite and TypeScript build, and fails on production dependency vulnerabilities rated high or critical.

## Operational notes

- The database bootstrap creates demonstration data only when the user collection is empty. Replace or remove demonstration accounts before any non-local deployment.
- The in-memory MongoDB and RabbitMQ fallbacks are intended for development only; production should use the configured persistent services.
- The custom-execution endpoint is rate-limited and limits source input to 64 KB. Submission and authentication routes also have in-process rate limits. Use a shared rate-limit store when horizontally scaling the API.
- Keep Docker images patched and regularly review the scheduled dependency-audit results.

## License

This repository is distributed under the MIT License.
