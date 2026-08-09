# CodingCON Production Deployment Guide
## Full Stack: Vercel + Render with 500+ Concurrent Users Support

---

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Environment Variables](#environment-variables)
6. [Load Balancing & Scaling](#load-balancing--scaling)
7. [Monitoring & Performance](#monitoring--performance)
8. [Troubleshooting](#troubleshooting)
9. [Security Checklist](#security-checklist)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Users (500+)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                        │
        ┌───────▼──────────┐    ┌────────▼──────────┐
        │ Vercel Frontend  │    │ Vercel Analytics │
        │ - Next.js        │    │ - Web Vitals     │
        │ - React 19       │    │ - Performance    │
        │ - TailwindCSS    │    │ - Error Tracking │
        │ - Socket.IO      │    │                  │
        │ - Monaco Editor  │    │                  │
        └───────┬──────────┘    └──────────────────┘
                │
        API Rewrite /api/* → Backend
                │
        ┌───────▼─────────────────────────────────────┐
        │  Render Web Service (Node.js + Express)     │
        │                                             │
        │  ┌─────────────────────────────────────┐  │
        │  │ Clustering (Multi-Core Support)    │  │
        │  │ - Master Process                   │  │
        │  │ - 4-16 Worker Processes (CPU count)│  │
        │  │ - Sticky Sessions for Socket.IO    │  │
        │  └─────────────────────────────────────┘  │
        │                                             │
        │  ┌─────────────────────────────────────┐  │
        │  │ Connection Pooling                 │  │
        │  │ - MongoDB: min=10, max=50          │  │
        │  │ - Keep-Alive: 30s interval        │  │
        │  │ - Timeout: 45s socket, 10s select│  │
        │  └─────────────────────────────────────┘  │
        │                                             │
        │  Routes:                                    │
        │  - /api/auth (rate-limited)                │
        │  - /api/problems                           │
        │  - /api/contests                           │
        │  - /api/submissions (rate-limited)         │
        │  - /api/leaderboard                        │
        │  - /api/run (rate-limited)                 │
        │  - /api/health (monitoring)                │
        │  - /api/cron (keep-alive)                  │
        └───────┬─────────────────────────────────────┘
                │
        ┌───────┴─────────────────┬──────────────────┐
        │                         │                  │
   ┌────▼─────────┐    ┌─────────▼──────┐  ┌────────▼───────┐
   │  MongoDB     │    │  RabbitMQ      │  │  Redis (opt.)  │
   │  Atlas       │    │  Queue Service │  │  Cache Layer   │
   │  - Connection│    │  - Judge Jobs  │  │  - Sessions    │
   │    Pooling   │    │  - Socket      │  │  - Rate Limits │
   │  - Replicas  │    │    Events      │  │  - Leaderboard │
   └──────────────┘    └────────────────┘  └────────────────┘
```

---

## Prerequisites

### Required Accounts
- [ ] [GitHub Account](https://github.com) (repository)
- [ ] [Render Account](https://render.com) (backend hosting)
- [ ] [Vercel Account](https://vercel.com) (frontend hosting)
- [ ] [MongoDB Atlas](https://mongodb.com/cloud/atlas) (database)
- [ ] [CloudAMQP](https://cloudamqp.com) or [LavinMQ](https://lavinmq.com) (message queue)

### Required Tools (Local Machine)
```bash
# Node.js 20 or higher
node --version

# npm or yarn
npm --version

# Git
git --version

# Optional: Render CLI for local testing
npm install -g @render-com/cli

# Optional: Vercel CLI for preview deployments
npm install -g vercel
```

### Security Requirements
- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Generate strong CRON_SECRET (min 32 characters)
- [ ] Enable 2FA on GitHub, Vercel, and Render accounts
- [ ] Use environment variables for all secrets (never hardcode)

---

## Backend Deployment (Render)

### Step 1: Prepare MongoDB Atlas

1. **Create MongoDB Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create new project: `CodingCON`
   - Create new cluster: `codingcon-cluster` (Shared tier for dev, M10+ for production)
   - Select region closest to users
   - Create database user with strong password
   - Add IP whitelist: Allow from Render (use `0.0.0.0/0` initially, restrict later)

2. **Get Connection String**
   - Click "Connect" on cluster
   - Select "Connect your application"
   - Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/codingcon`
   - Save this for later ✅

### Step 2: Prepare Message Queue (Optional but Recommended)

For production with 500+ users, use remote queue:

**Option A: CloudAMQP** (recommended, free tier available)
1. Go to [CloudAMQP](https://cloudamqp.com)
2. Create new instance: `codingcon-prod` (Little Lemur tier free)
3. Copy URL: `amqp://user:pass@...`

**Option B: LavinMQ** (simpler alternative)
1. Go to [LavinMQ](https://lavinmq.com)
2. Create new tenant
3. Copy connection string

### Step 3: Prepare Redis (Optional, for caching)

For better performance with 500+ users:

1. Go to [Upstash Redis](https://upstash.com) or [Redis Cloud](https://redis.com/cloud/)
2. Create free Redis database
3. Copy Redis URL: `redis://default:password@host:6379`

### Step 4: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. **Connect Repository**
   - Select your GitHub repo
   - Click "Connect"
   
4. **Configure Web Service**
   ```
   Name:                   codingcon-backend
   Environment:            Node
   Region:                 Select closest to users
   Branch:                 main
   Root Directory:         backend
   Build Command:          npm install && npm run build
   Start Command:          npm run start
   Plan:                   Standard (for production load)
   Auto-Deploy:            Yes
   ```

5. **Add Environment Variables**
   Click **"Environment"** and add:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `NODE_ENV` | `production` | Critical for optimizations |
   | `PORT` | `4000` | Standard port |
   | `MONGODB_URI` | `mongodb+srv://user:pass@...` | From MongoDB Atlas step |
   | `JWT_SECRET` | `your-64-char-random-string` | Generate: `openssl rand -hex 32` |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` | Update after Vercel deployment |
   | `CRON_SECRET` | `your-64-char-random-string` | Generate: `openssl rand -hex 32` |
   | `CLUSTER_ENABLED` | `true` | Enable multi-core clustering |
   | `WORKERS` | `4` | Auto-detect or specify (1-16) |
   | `DB_POOL_SIZE` | `50` | MongoDB connection pool max |
   | `DB_MIN_POOL_SIZE` | `10` | MongoDB connection pool min |
   | `MAX_JUDGE_JOBS` | `4` | Concurrent judge jobs |
   | `QUEUE_CONCURRENCY` | `2` | Queue consumer concurrency |
   | `RABBITMQ_URL` | `amqp://user:pass@...` | Optional, from CloudAMQP |
   | `REDIS_URL` | `redis://default:pass@...` | Optional, from Upstash |

6. **Deploy**
   - Click **"Create Web Service"**
   - Wait for build to complete (5-10 minutes)
   - Copy deployed URL: `https://codingcon-backend.onrender.com` ✅

### Step 5: Configure Render Cron Jobs

Add cron jobs to keep backend warm and sync contests:

Edit **`backend/render.yaml`**:
```yaml
services:
  - type: web
    name: codingcon-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: CLUSTER_ENABLED
        value: true
      # ... other vars

  - type: cron
    name: codingcon-backend-cron
    runtime: node
    schedule: "*/10 * * * *"  # Every 10 minutes
    buildCommand: echo "Cron ready"
    startCommand: node -e "const u = (process.env.BACKEND_URL || 'https://codingcon-backend.onrender.com') + '/api/cron'; const h = process.env.CRON_SECRET ? { Authorization: 'Bearer ' + process.env.CRON_SECRET } : {}; fetch(u, { headers: h }).then(r => r.json()).then(console.log).catch(console.error)"
    envVars:
      - key: BACKEND_URL
        value: https://codingcon-backend.onrender.com
      - key: CRON_SECRET
        sync: false  # Use from web service
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Build

Verify build succeeds locally:
```bash
npm install
npm run build
```

### Step 2: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. **Import Repository**
   - Select your GitHub repo
   - Click "Import"

4. **Configure Project**
   ```
   Framework Preset:      Next.js (auto-detected)
   Root Directory:        ./ (default)
   Build Command:         next build (auto-filled)
   Output Directory:      .next (auto-filled)
   Install Command:       npm install
   Development Command:   next dev (auto-filled)
   ```

5. **Add Environment Variables**
   Click **"Environment Variables"** and add:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://codingcon-backend.onrender.com/api` | Update with actual Render URL |
   | `NEXT_PUBLIC_WS_BASE_URL` | `https://codingcon-backend.onrender.com` | WebSocket URL |
   | `BACKEND_URL` | `https://codingcon-backend.onrender.com` | Server-side rewrites |
   | `CRON_SECRET` | `your-cron-secret` | Match backend CRON_SECRET |

6. **Deploy**
   - Click **"Deploy"**
   - Wait for build to complete (3-5 minutes)
   - Copy deployed URL: `https://your-app.vercel.app` ✅

### Step 3: Update CORS Origin on Render

Go back to Render backend settings:
1. Update `CORS_ORIGIN` environment variable with Vercel URL
2. Redeploy backend
   ```bash
   # Or use Render dashboard to manually restart
   ```

---

## Environment Variables

### Backend (.env in `backend/` directory)

```bash
# Core Configuration
NODE_ENV=production
PORT=4000
CLUSTER_ENABLED=true
WORKERS=4

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/codingcon

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# CORS & Security
CORS_ORIGIN=https://your-app.vercel.app

# Queue & Caching
RABBITMQ_URL=amqp://user:pass@...
REDIS_URL=redis://default:pass@...

# Performance
DB_POOL_SIZE=50
DB_MIN_POOL_SIZE=10
MAX_JUDGE_JOBS=4
QUEUE_CONCURRENCY=2

# Cron & Monitoring
CRON_SECRET=your-cron-secret-min-32-chars
```

### Frontend (.env.production in root)

```bash
# Backend URLs
NEXT_PUBLIC_API_BASE_URL=https://codingcon-backend.onrender.com/api
NEXT_PUBLIC_WS_BASE_URL=https://codingcon-backend.onrender.com
BACKEND_URL=https://codingcon-backend.onrender.com

# Security
CRON_SECRET=your-cron-secret-min-32-chars

# Next.js
NODE_ENV=production
```

---

## Load Balancing & Scaling

### Backend Clustering (Built-in)

The backend uses Node.js cluster module for multi-core CPU utilization:

```
Main Process (Master)
├── Worker 1 (CPU Core 0) → MongoDB Pool 1-5
├── Worker 2 (CPU Core 1) → MongoDB Pool 6-10
├── Worker 3 (CPU Core 2) → MongoDB Pool 11-15
├── Worker 4 (CPU Core 3) → MongoDB Pool 16-20
└── ... (up to CPU count)

Total connections: 50 (maxPoolSize)
Each worker gets ~5-10 connections
```

**Configuration in `backend/src/config/performance.ts`:**
```typescript
mongoose: {
  maxPoolSize: 50,        // Total connections
  minPoolSize: 10,        // Keep-alive minimum
  socketTimeoutMS: 45000, // Connection timeout
},
```

### Render Horizontal Scaling

Render automatically handles:
- **CPU Scaling**: Allocates more CPU as needed
- **Memory Scaling**: Up to 4GB with Standard+ plan
- **Request Queuing**: Automatically queues excess requests
- **Health Checks**: Restarts unhealthy instances

To upgrade plan on Render:
1. Go to Web Service Settings
2. Click "Plan" → Select "Standard+" or "Pro"
3. Render handles zero-downtime scaling

### Vercel Auto-Scaling

Vercel automatically handles:
- **Edge Distribution**: 300+ global edge locations
- **Serverless Functions**: Auto-scales based on demand
- **CDN Caching**: Reduces load on origin
- **Automatic Rollback**: Failed deployments rolled back instantly

---

## Monitoring & Performance

### Backend Health Monitoring

```bash
# Check backend health
curl https://codingcon-backend.onrender.com/api/health
# Response: { "status": "ok", "database": "mongodb", "judge": "docker-isolated", "ts": "..." }

# Check cron job
curl https://codingcon-backend.onrender.com/api/cron
# Response: { "message": "Keep-alive successful", "timestamp": "..." }
```

### Render Monitoring Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select "codingcon-backend" service
3. View:
   - **Logs**: Real-time server logs
   - **Metrics**: CPU, Memory, Network usage
   - **Deployments**: History and status
   - **Health**: Instance health checks

### Vercel Analytics

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select "codingcon" project
3. Click "Analytics" tab
4. View:
   - **Web Vitals**: FCP, LCP, CLS scores
   - **Real User Monitoring**: Actual user performance
   - **Functions**: API route performance
   - **Edge**: CDN and edge function metrics

### Performance Targets (500+ concurrent users)

| Metric | Target | Notes |
|--------|--------|-------|
| First Contentful Paint (FCP) | < 1.5s | Browser shows first content |
| Largest Contentful Paint (LCP) | < 2.5s | Browser shows main content |
| Cumulative Layout Shift (CLS) | < 0.1 | Visual stability |
| API Response Time | < 200ms | Server response |
| Database Query Time | < 50ms | With connection pooling |
| JavaScript Bundle Size | < 150KB | Gzipped |
| CSS Bundle Size | < 30KB | Minified |
| Time to Interactive (TTI) | < 3s | Page fully interactive |

### New Relic / DataDog Integration (Optional)

For advanced monitoring:

```bash
# Add New Relic APM
npm install newrelic

# Add to backend/src/index.ts (top line)
require('newrelic');

# Create newrelic.js config file
```

---

## Troubleshooting

### Backend Issues

**Problem**: Build fails on Render
```
Solution: Check logs for missing dependencies
npm install
npm run build  # Test locally first
```

**Problem**: MongoDB connection timeout
```
Solution: Check IP whitelist on MongoDB Atlas
- Allow 0.0.0.0/0 initially (development)
- Restrict to Render IP (production)
```

**Problem**: High memory usage
```
Solution: Reduce connection pool sizes
DB_POOL_SIZE=30
DB_MIN_POOL_SIZE=5
```

### Frontend Issues

**Problem**: WebSocket connection fails
```
Solution: Check environment variables
NEXT_PUBLIC_WS_BASE_URL must match backend URL
Test: Open DevTools → Network → WS tab
```

**Problem**: Images not loading
```
Solution: Check image domains in next.config.ts
Add backend domain if fetching images from API
```

**Problem**: Build size too large
```
Solution: Enable code splitting
npm run build  # Check .next/static size
Minimize: Remove unused dependencies
```

### Common Errors

**Error**: `CORS error: Origin not allowed`
```
Fix: Update CORS_ORIGIN on backend
Include Vercel domain: https://your-app.vercel.app
```

**Error**: `JWT_SECRET not set`
```
Fix: Add JWT_SECRET to Render environment variables
Generate: openssl rand -hex 32
```

**Error**: `MongoDB connection pool exhausted`
```
Fix: Increase maxPoolSize or reduce concurrent requests
Review rate limiting settings
Add Redis for session caching
```

---

## Security Checklist

- [ ] **Secrets Management**
  - [ ] JWT_SECRET: min 64 characters (openssl rand -hex 32)
  - [ ] CRON_SECRET: min 64 characters (openssl rand -hex 32)
  - [ ] Database password: complex, unique
  - [ ] Never commit .env files

- [ ] **Database Security**
  - [ ] MongoDB IP whitelist: Restrict to Render IP
  - [ ] Strong database user password
  - [ ] Enable MongoDB encryption at rest
  - [ ] Enable MongoDB HTTPS connections

- [ ] **API Security**
  - [ ] CORS whitelist: Only Vercel domain
  - [ ] Rate limiting: Enabled on auth, submissions
  - [ ] Helmet security headers: Enabled
  - [ ] Request size limits: 2MB max

- [ ] **Frontend Security**
  - [ ] No secrets in environment variables (no `NEXT_PUBLIC_` for secrets)
  - [ ] Content Security Policy: Configured
  - [ ] X-Frame-Options: Set to DENY
  - [ ] HTTPS enforced: Automatic on Vercel

- [ ] **Infrastructure Security**
  - [ ] 2FA enabled: GitHub, Vercel, Render
  - [ ] SSH keys: Stored securely
  - [ ] Render deploy key: Limited to deployment
  - [ ] Vercel tokens: Limited scope

- [ ] **Monitoring & Alerts**
  - [ ] Error logging: Configured
  - [ ] Performance monitoring: Enabled
  - [ ] Health checks: Running
  - [ ] Automated backups: Enabled (MongoDB)

- [ ] **Deployment Safety**
  - [ ] Staging environment: Test before production
  - [ ] Blue-green deployments: Use branches
  - [ ] Rollback plan: Documented
  - [ ] Incident response: Team trained

---

## Next Steps

1. **Day 1**: Deploy backend to Render
2. **Day 2**: Deploy frontend to Vercel
3. **Day 3**: Run load tests (500+ concurrent users)
4. **Day 4**: Monitor and optimize performance
5. **Day 5**: Security audit and hardening
6. **Day 6**: Team training and documentation
7. **Day 7**: Go live!

---

## Support & Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Socket.IO Deployment](https://socket.io/docs/v4/deployment/)

---

**Last Updated**: August 2026  
**Version**: 2.0 (Production Ready - 500+ Users)
