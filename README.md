# 🚀 CodingCON — Real-Time Online Judge & Competitive Programming Platform

CodingCON is an enterprise-grade, real-time online judge and competitive programming assessment platform built for universities, coding contests, and technical assessments. Inspired by platforms like LeetCode and Codeforces, CodingCON provides an interactive web workspace, real-time WebSocket leaderboards, and isolated multi-language Docker execution sandbox.

---

## 🟢 Current System Status

| Component | Port / URI | Tech Stack | Status |
| :--- | :--- | :--- | :---: |
| **Frontend Web App** | `http://localhost:3000` | Next.js 16 (Turbopack) + React 19 | 🟢 **Active** |
| **Backend API Gateway** | `http://localhost:4000/api` | Express.js + Socket.IO | 🟢 **Active** |
| **Judge Worker Process** | Background Task | Node.js + TypeScript Worker | 🟢 **Active** |
| **Database** | MongoDB Atlas / Memory | Mongoose ORM | 🟢 **Connected** |
| **Message Queue** | `judge_queue` & `socket_events_queue` | RabbitMQ (amqplib) | 🟢 **Connected** |
| **Execution Sandbox** | Docker Engine | Python, JS, C++, Java Images | 🟢 **Ready** |

---

## ✨ Key Features

### ⚡ Isolated Multi-Language Docker Sandbox
- **Supported Languages**: 
  - **Python 3.11** (`python:3.11-alpine`)
  - **JavaScript** (`node:20-alpine`)
  - **C++ 17** (`gcc:13` with `g++ -O2 -std=c++17`)
  - **Java 21** (`eclipse-temurin:21-jdk-alpine` with `javac`)
- **Dynamic Java Class Resolution**: Automatically parses source code for `public class Main`, `public class Solution`, or custom class names, avoiding Java compilation filename mismatches.
- **Secure Sandbox Environment**: Configured with strict CPU limits (`0.5 cpus`), memory limits (`256MB`), process limits (`ulimit nproc=64`), no network access (`--network none`), and isolated read-write temporary directories.

### 📊 Real-Time Live Leaderboard & WebSocket Sync
- **Socket.IO Integration**: Submissions and verdicts are broadcast live across connected clients.
- **Penalty Time Calculation**: Dynamically computes solve times and penalty minutes for incorrect attempts.
- **60-Second Fallback Polling**: Ensures standings remain 100% in sync even if WebSocket connections drop.

### 🎯 LeetCode-Style Error Visualizer & Verdict Engine
- **Rich Error Reporting**: Surfaces line-level compiler errors, stack traces, runtime errors (`RE`), time limit exceeded (`TLE`), and memory limit exceeded (`MLE`).
- **Normalized Comparison Engine**: Strips carriage returns (`\r\n`) and trims whitespace to prevent false `Wrong Answer` verdicts across operating systems.
- **Interactive Diff Viewer**: Allows users to inspect expected vs. actual outputs for sample test cases.

### 🏆 Contest System & Automated Archive Release
- **Contest Countdown Timer**: Interactive countdown timer (`HH:MM:SS`) on contest headers and standings pages.
- **Problem Archiving**: Contest problems remain hidden from the main Problem Archive until the contest timer naturally expires.
- **Live Announcements**: Real-time broadcasts for contest clarifications and updates.

### 👤 Dynamic User Profiles & Points System
- **Total Points Counter**: Accumulates points based on problem difficulty upon first successful `AC` verdict.
- **Submission History**: Complete timeline of verdicts, runtimes, memory usage, and submitted code.
- **Streak & Solved Stats**: Tracks active streak days and unique solved problems count.

### 🔑 Role-Based Access Control (RBAC) & Admin Portal
- **Database-Driven Roles**: Dynamic permissions stored in MongoDB (`admin`, `problem_setter`, `student`).
- **Admin Dashboard**: Full CRUD interface for creating problems, adding test cases, managing contests, and post announcements.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router + Turbopack), React 19, TypeScript, TailwindCSS, Framer Motion, Monaco Code Editor, `next-themes` |
| **Backend** | Express.js, Node.js, TypeScript, Mongoose (MongoDB ORM), Socket.IO, JWT Auth |
| **Queue & Worker** | RabbitMQ (amqplib), Asynchronous Worker Queue Process |
| **Code Judge** | Docker Engine (isolated container per submission), Child Process Runner |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User["👤 User Browser / Client"] -->|HTTP / WebSockets| Frontend["🌐 Next.js Frontend (Port 3000)"]
    Frontend -->|API Rewrites / WS Proxy| Gateway["🔌 Express API Gateway (Port 4000)"]
    
    Gateway -->|Auth & Data| Mongo[("🍃 MongoDB Database")]
    Gateway -->|Enqueue Execution Job| MQ["🐇 RabbitMQ (judge_queue)"]
    
    MQ -->|Consume Job| Worker["⚙️ Judge Worker Process"]
    Worker -->|Execute Code in Isolated Container| Docker["🐳 Docker Sandbox Containers\n(Python / JS / C++ / Java)"]
    
    Docker -->|Return Verdict & Logs| Worker
    Worker -->|Update Verdict & Stats| Mongo
    Worker -->|Publish Socket Event| MQ
    MQ -->|Socket Event Consumer| Gateway
    Gateway -->|Broadcast Live Verdict| User
```

---

## 🐳 Docker Setup & Configuration

Docker Engine is required to execute user-submitted code in isolated containers.

### 1. Install & Start Docker
- Ensure **Docker Desktop** (Windows/macOS) or **Docker Engine** (Linux) is installed and running.
- Verify Docker is active in your terminal:
  ```bash
  docker info
  ```

### 2. Pre-Pull Execution Sandbox Images
To avoid execution timeouts during initial submission runs, pre-pull the execution images for each language:

```bash
# Python 3.11 Execution Environment
docker pull python:3.11-alpine

# JavaScript (Node.js 20) Execution Environment
docker pull node:20-alpine

# C++ (GCC 13) Execution Environment
docker pull gcc:13

# Java 21 (Temurin JDK) Execution Environment
docker pull eclipse-temurin:21-jdk-alpine
```

---

## 🐇 RabbitMQ Setup & Configuration

RabbitMQ handles asynchronous submission queuing between the API Gateway and the Judge Worker process.

### Option A: Run RabbitMQ via Docker (Recommended)
You can launch a local RabbitMQ container with the management interface enabled:

```bash
docker run -d \
  --name codingcon-rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```
- **AMQP Protocol Port**: `5672`
- **Management Web UI**: `http://localhost:15672` (default login: `guest` / `guest`)

### Option B: CloudAMQP (Hosted RabbitMQ)
If using a managed cloud instance (e.g. CloudAMQP):
1. Create a free instance on [CloudAMQP](https://www.cloudamqp.com/).
2. Copy your `amqps://...` connection URL.
3. Add `RABBITMQ_URL` to your `backend/.env` file:
   ```env
   RABBITMQ_URL=amqps://username:password@hostname/vhost
   ```

---

## 🚀 Step-by-Step Installation & Running Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Monishwaran45/codingCON.git
cd codingCON

# Install Frontend dependencies
npm install

# Install Backend dependencies
cd backend
npm install
```

### 2. Environment Variables Setup
Create a `.env` file inside `backend/.env`:

```env
PORT=4000
NODE_ENV=development

# JWT Secret
JWT_SECRET=codingcon_super_secret_jwt_key

# MongoDB Connection String
MONGODB_URI=mongodb+srv://monishlegend1780_db_user:6yBIRY2LLGfa2PLP@cluster0.juix7su.mongodb.net/codingcon?appName=Cluster0

# Code Execution Engine (Docker enabled)
JUDGE_USE_DOCKER=true
JUDGE_TIMEOUT_MS=10000
JUDGE_MEMORY_MB=256

# RabbitMQ Connection String
RABBITMQ_URL=amqp://localhost:5672
```

### 3. Running the Application Processes

Open 3 terminal windows to run the complete platform:

#### Terminal 1 — Express Backend API Gateway (Port 4000)
```bash
cd backend
npm run dev
```

#### Terminal 2 — Asynchronous Judge Worker Process
```bash
cd backend
npm run worker
```

#### Terminal 3 — Next.js Frontend Application (Port 3000)
```bash
# From root codingCON folder
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 📁 Directory Structure

```
codingCON/
├── backend/                  # Express API Gateway & Judge Engine
│   ├── src/
│   │   ├── db/               # Database Connection & Mongoose Schemas (User, Problem, Contest, Leaderboard)
│   │   ├── judge/            # Docker & Native Code Execution Runner
│   │   ├── middleware/       # JWT Auth & Role-Based Access Control Middleware
│   │   ├── queue/            # RabbitMQ Publisher & Consumer Logic
│   │   ├── routes/           # REST API Route Handlers (Auth, Problems, Contests, Submissions, Leaderboard, Profile)
│   │   ├── socket/           # Socket.IO Gateway Setup
│   │   ├── index.ts          # Express Server Entry Point
│   │   └── worker.ts         # Asynchronous Submission Worker Engine
│   └── package.json
│
├── src/                      # Next.js 16 Frontend (App Router)
│   ├── app/                  # App Router Pages & API Proxies
│   │   ├── admin/            # Admin Dashboard, Problem Creation, Contest Management
│   │   ├── contest/          # Contest Workspace & Live Leaderboard Standings
│   │   ├── problems/         # Problem Archive & Monaco Editor Workspace
│   │   ├── profile/          # User Profile, Total Points, & Submission History
│   │   └── layout.tsx        # Global Layout with ThemeProvider & Navbar
│   ├── components/           # UI Components (Editor, Verdict, Contest, Profile, Leaderboard)
│   ├── hooks/                # Custom React Hooks (Auth, WebSockets, Socket Listeners)
│   ├── lib/                  # API Client, Fonts, Utilities
│   ├── store/                # Zustand Global State Management
│   └── types/                # TypeScript Interfaces & Types
│
├── next.config.ts            # Turbopack & API Proxy Rewrites Configuration
└── README.md
```

---

## 📑 API Endpoint Summary

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (defaults to `student` role) |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive HTTP-only cookie token |
| `GET` | `/api/auth/me` | Authenticated | Fetch authenticated user details & permissions |
| `GET` | `/api/problems` | Authenticated | List all active problems (excludes active contest problems) |
| `GET` | `/api/problems/:id` | Authenticated | Fetch problem description & sample test cases |
| `POST` | `/api/problems` | Admin / Setter | Create a new problem with test cases |
| `GET` | `/api/contest` | Authenticated | List all contests |
| `GET` | `/api/contest/:id` | Authenticated | Fetch contest details & problem set |
| `GET` | `/api/leaderboard/:contestId` | Authenticated | Fetch live contest standings |
| `POST` | `/api/submissions` | Authenticated | Submit code for execution in Docker sandbox |
| `GET` | `/api/profile` | Authenticated | Fetch user points, solved count, and submission history |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.


---

## 🎨 Dark/Light Mode Theme System (v2.1)

### Overview
CodingCON features a fully functional dark/light mode theme toggle integrated with Tailwind CSS and `next-themes`.

### How It Works
1. **Theme Provider**: `next-themes` package manages theme state using the `class` strategy
2. **Persistence**: Theme preference is stored in browser's `localStorage` under key `codingcon-theme`
3. **Early Script**: `ThemeScript` component injects a script that runs before page render to prevent flash of unstyled content (FOUC)
4. **Configuration**: Tailwind dark mode uses the `class` selector (adds `dark` class to `<html>`)

### Using the Theme Toggle
- Click the **moon/sun icon** in the top-right navbar to toggle between light and dark modes
- The theme preference is automatically saved and persists across browser sessions
- The theme applies to:
  - Background colors (`bg-white` / `dark:bg-zinc-950`)
  - Text colors (`text-zinc-900` / `dark:text-zinc-100`)
  - Borders (`border-zinc-200` / `dark:border-zinc-800`)
  - All UI components with `dark:` prefix

### Implementation Details
- **tailwind.config.ts**: Added explicit `darkMode: 'class'` configuration
- **ThemeProvider**: Set with `storageKey="codingcon-theme"` and `enableTransitionOnChange={true}`
- **ThemeScript** (`src/components/ThemeScript.tsx`): Early-running script to prevent FOUC
- All components use Tailwind's `dark:` variant for dark mode styling

### Testing the Theme
1. Open http://localhost:3000 in your browser
2. Click the moon/sun icon in the navbar
3. Verify the UI transitions smoothly between light and dark modes
4. Refresh the page - your theme choice should persist
5. Open DevTools → Application → Local Storage → check `codingcon-theme` value

### Troubleshooting
- **Theme not persisting**: Check browser's localStorage is enabled
- **FOUC (flash of wrong theme)**: Ensure `ThemeScript` is included in the `<head>`
- **Styles not updating**: Clear browser cache and restart the dev server

