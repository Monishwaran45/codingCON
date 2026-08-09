# CodingCON Monitoring & Performance Guide
## Real-Time Monitoring for 500+ Concurrent Users

---

## 📋 Table of Contents
1. [Monitoring Overview](#monitoring-overview)
2. [Backend Monitoring (Render)](#backend-monitoring-render)
3. [Frontend Monitoring (Vercel)](#frontend-monitoring-vercel)
4. [Performance Metrics](#performance-metrics)
5. [Load Testing](#load-testing)
6. [Alerting & Notifications](#alerting--notifications)
7. [Optimization Tips](#optimization-tips)
8. [Dashboards & Tools](#dashboards--tools)

---

## Monitoring Overview

### Three-Tier Monitoring Strategy

```
┌──────────────────────────────────────────────────────────┐
│         Application Performance Monitoring (APM)         │
│  Real-time metrics, distributed tracing, error tracking  │
└──────────────────────────────────────────────────────────┘
                           ▲
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼─────┐      ┌─────▼────┐      ┌─────▼────┐
   │ Infra    │      │ Database │      │ Frontend │
   │ Monitoring      │ Monitoring      │ Metrics
   │(Render)   │      │(MongoDB)  │      │(Vercel)
   └──────────┘      └───────────┘      └──────────┘
```

### Key Metrics by Layer

| Layer | Metrics | Tools |
|-------|---------|-------|
| **Infrastructure** | CPU, Memory, Network, Disk | Render Dashboard |
| **Database** | Connection Pool, Query Time, Replication Lag | MongoDB Atlas |
| **API** | Request Count, Response Time, Error Rate | Render Logs |
| **WebSocket** | Active Connections, Message Rate, Latency | Socket.IO Stats |
| **Frontend** | FCP, LCP, CLS, TTI, Bundle Size | Vercel Analytics |
| **Business** | Contests, Submissions, Users, Leaderboard | Custom Dashboards |

---

## Backend Monitoring (Render)

### 1. Render Dashboard (Built-in)

Access: [dashboard.render.com](https://dashboard.render.com)

#### Real-Time Metrics
```
codingcon-backend Service
├── Status: Active / Stopped / Rebuilding
├── Deploy Status: Deployed / Failed / Building
├── CPU Usage: 0-100%
├── Memory Usage: 0-4GB
├── Network In/Out: Bytes/sec
└── Logs: Real-time streaming
```

**View Logs:**
1. Click "codingcon-backend" service
2. Click "Logs" tab
3. Stream in real-time or download

**View Metrics:**
1. Click "codingcon-backend" service
2. Click "Metrics" tab
3. Adjust time range (1h, 24h, 7d, 30d)

### 2. Health Check Monitoring

Backend exposes two health endpoints:

```bash
# Application health
curl https://codingcon-backend.onrender.com/api/health
# Response:
{
  "status": "ok",
  "database": "mongodb",
  "judge": "docker-isolated",
  "ts": "2026-08-09T10:30:00Z"
}

# Cron keep-alive
curl https://codingcon-backend.onrender.com/api/cron
# Response:
{
  "message": "Keep-alive successful",
  "timestamp": "2026-08-09T10:30:00Z"
}
```

### 3. Log Monitoring (Key Patterns)

**Watch for these in logs:**

✅ **Healthy Signs:**
```
✓ Socket.IO gateway ready
✓ Connected to Primary MongoDB
✓ Worker [12345] started
✓ CodingCON Hardened Backend running on http://localhost:4000
📊 Socket.IO: 250 connections (peak: 500)
```

⚠️ **Warning Signs:**
```
⚠️  Primary MongoDB connection failed
⚠️  MongoDB disconnected
⚠️  Worker exited with code 1
⚠️  Falling back to Docker MongoDB
```

❌ **Critical Issues:**
```
❌ FATAL SERVER STARTUP FAILURE
❌ Failed to start fallback In-Memory MongoDB
💾 Out of Memory error
```

### 4. Connection Pool Monitoring

Check in logs every 5 minutes:

```
Performance Configuration:
   DB Pool: 10-50  ← Should be stable
   Socket.IO Ping: 25000ms
   Judge Jobs: 4
   Queue Concurrency: 2
```

**Monitor this metric:**
```
MongoDB Connection Pool Usage = Active Connections / Max Pool Size
Target: 30-60% utilization
Warning: > 80% (may need to increase pool size)
Critical: > 95% (pool exhausted, requests queued)
```

### 5. Socket.IO Connection Monitoring

Check every 5 minutes in logs:

```
📊 Socket.IO Stats:
    - Active Connections: 450
    - Peak Connections: 512
    - Total Disconnects: 1234
    - Errors: 3
    - Connected Rooms: 128
```

**Healthy targets:**
- Active Connections: 0-500+
- Error Rate: < 0.5%
- Average Disconnect Reason: "client namespace disconnect"

---

## Frontend Monitoring (Vercel)

### 1. Vercel Analytics Dashboard

Access: [vercel.com/dashboard](https://vercel.com/dashboard) → Project → Analytics

#### Web Vitals Metrics

| Metric | Target | Status |
|--------|--------|--------|
| First Contentful Paint (FCP) | < 1.5s | 🟢 Good |
| Largest Contentful Paint (LCP) | < 2.5s | 🟢 Good |
| Cumulative Layout Shift (CLS) | < 0.1 | 🟢 Good |
| Time to Interactive (TTI) | < 3s | 🟢 Good |
| First Input Delay (FID) | < 100ms | 🟢 Good |

**Monitor these weekly:**
1. Trends over time (should be stable or improving)
2. Compare by device (mobile vs desktop)
3. Compare by geography (different regions)

#### Real User Monitoring (RUM)

View actual user performance:
1. Click "Analytics" tab
2. Filter by:
   - Device type (mobile, desktop, tablet)
   - Browser (Chrome, Firefox, Safari)
   - Country
   - Operating System

### 2. Deployment Monitoring

**View deployments:**
1. Click "Deployments" tab
2. See real-time deploy status
3. View build logs
4. See function runtime and memory

**Monitor build time:**
- Target: < 5 minutes
- Warning: 5-10 minutes (may need optimization)
- Critical: > 10 minutes (investigate build issues)

### 3. Function Monitoring

**For API routes:**
1. Click "Functions" tab
2. View:
   - Function name
   - Invocations (count)
   - Avg duration
   - Max duration
   - Errors

### 4. Error Tracking

**Configure error monitoring:**
```javascript
// frontend/src/app/layout.tsx
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Report uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Frontend error:', event);
      // Send to monitoring service
    });

    // Report unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled rejection:', event.reason);
      // Send to monitoring service
    });
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

---

## Performance Metrics

### Backend Performance Targets

```
Request Metrics (with 500+ concurrent users):
├── p50 (median):     30-50ms      ✓
├── p75:              75-100ms     ✓
├── p95:              150-200ms    ✓
├── p99:              300-500ms    ⚠️ (acceptable, but monitor)
└── Max Response Time: < 5000ms    ✓

Error Metrics:
├── Error Rate:       < 0.1%       ✓
├── 4xx Errors:       < 1%         ✓
├── 5xx Errors:       < 0.05%      ✓
└── Timeout Errors:   < 0.01%      ✓

Database Metrics:
├── Query Time:       < 50ms       ✓
├── Connection Errors: < 1/hour    ✓
├── Pool Exhaustion:  Never        ✓
└── Replication Lag:  < 100ms      ✓

Socket.IO Metrics:
├── Connection Time:  < 500ms      ✓
├── Message Latency:  < 100ms      ✓
├── Disconnect Rate:  < 1/min      ✓
└── Memory/Connection: < 1MB       ✓
```

### Frontend Performance Targets

```
Bundle Size:
├── JavaScript:       < 150KB      ✓ (gzipped)
├── CSS:              < 30KB       ✓ (minified)
├── Fonts:            < 50KB       ✓ (system fonts preferred)
└── Images:           < 100KB      ✓ (per page avg)

Core Web Vitals:
├── FCP:              < 1.5s       ✓
├── LCP:              < 2.5s       ✓
├── CLS:              < 0.1        ✓
└── TTI:              < 3s         ✓

Load Time:
├── First Paint:      < 1s         ✓
├── Page Interaction: < 3s         ✓
├── API Response:     < 200ms      ✓
└── WebSocket Init:   < 500ms      ✓
```

---

## Load Testing

### 1. K6 Load Testing Tool

Install:
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# or Docker
docker run -i grafana/k6 run - < script.js
```

### 2. Sample Load Test Script

Create `load-test.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Test 500 concurrent users
  stages: [
    { duration: '1m', target: 100 },   // Ramp-up
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  // Test homepage
  const res = http.get('https://your-app.vercel.app/');
  check(res, {
    'homepage status 200': (r) => r.status === 200,
    'homepage response time': (r) => r.timings.duration < 1000,
  });

  // Test API
  const apiRes = http.get('https://your-app.vercel.app/api/problems');
  check(apiRes, {
    'api status 200': (r) => r.status === 200,
    'api response time': (r) => r.timings.duration < 200,
  });

  // Test WebSocket connection
  const wsRes = http.get('https://your-app.vercel.app/api/health');
  check(wsRes, {
    'health check 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

### 3. Run Load Test

```bash
# Run locally
k6 run load-test.js

# Run with output to file
k6 run load-test.js --out csv=results.csv

# View results
# Summary table + detailed metrics
```

### 4. Expected Results (500 users)

```
✓ Homepage response time: p95 < 200ms
✓ API response time: p95 < 150ms
✓ Error rate: < 0.1%
✓ Connection success rate: > 99.9%
✓ Total throughput: 1000+ req/sec
```

### 5. Alternative: Artillery Load Testing

```bash
# Install
npm install -g artillery

# Create config
cat > load-test.yml << EOF
config:
  target: 'https://your-app.vercel.app'
  phases:
    - duration: 60, arrivalRate: 10  # 10 users/sec for 1 min
    - duration: 300, arrivalRate: 50 # 50 users/sec for 5 min
  processor: './processor.js'

scenarios:
  - name: 'Main Flow'
    flow:
      - get:
          url: '/'
          expect: 200
      - get:
          url: '/api/problems'
          expect: 200
      - think: 5
      - get:
          url: '/api/health'
          expect: 200
EOF

# Run
artillery run load-test.yml
```

---

## Alerting & Notifications

### 1. Uptime Robot (Free)

Setup: [uptimerobot.com](https://uptimerobot.com)

**Create monitor:**
1. Add monitoring URL: `https://codingcon-backend.onrender.com/api/health`
2. Interval: 5 minutes
3. Timeout: 30 seconds
4. Get alerts via:
   - Email
   - Slack
   - SMS (paid)
   - Webhooks

### 2. Status Page

Create public status page:
```
https://status.your-domain.com
├── Backend: Online ✓
├── Frontend: Online ✓
├── Database: Online ✓
├── WebSocket: Online ✓
└── Last checked: 2 minutes ago
```

Use tools:
- [Statuspage.io](https://statuspage.io) (free tier)
- [UptimeRobot Status Page](https://uptimerobot.com/statuspage)

### 3. Slack Integration

**Render + Slack:**
1. Go to Render dashboard
2. Settings → Integrations
3. Connect Slack
4. Select channels for notifications:
   - Deploy started
   - Deploy succeeded
   - Deploy failed
   - Service crashed
   - Service recovered

**Example Slack message:**
```
🚨 Alert: API Response Time Critical
Service: codingcon-backend
Issue: p95 response time > 500ms
Duration: 5 minutes
Action: Check database connections
Links: [Logs] [Metrics] [Dashboard]
```

### 4. Custom Webhook Alerts

```bash
# Example: Notify when error rate > 1%
curl -X POST https://your-webhook.com/alert \
  -H "Content-Type: application/json" \
  -d '{
    "alert": "High error rate",
    "value": "2.5%",
    "threshold": "1%",
    "service": "backend",
    "timestamp": "2026-08-09T10:30:00Z"
  }'
```

---

## Optimization Tips

### Backend Optimization

#### 1. Database Query Optimization
```typescript
// ❌ Bad: N+1 query problem
const problems = await Problem.find();
for (const p of problems) {
  const testCases = await TestCase.find({ problemId: p._id });
}

// ✅ Good: Batch query
const problems = await Problem.find().populate('testCases');
```

#### 2. Connection Pooling Tuning
```typescript
// backend/src/config/performance.ts
mongoose: {
  maxPoolSize: 50,        // Increase if pool exhaustion
  minPoolSize: 10,        // Reduce memory if needed
  socketTimeoutMS: 45000, // Increase for slow networks
}
```

#### 3. Cache Frequently Accessed Data
```typescript
// Use Redis for leaderboard (updates every 30s)
const leaderboardCache = await redis.get('leaderboard:contestId');
if (!leaderboardCache) {
  const leaderboard = await Leaderboard.find();
  await redis.setex('leaderboard:contestId', 30, JSON.stringify(leaderboard));
}
```

#### 4. Batch Database Writes
```typescript
// ❌ Bad: Multiple writes
for (const submission of submissions) {
  await submission.save();
}

// ✅ Good: Batch write
await Submission.insertMany(submissions);
```

### Frontend Optimization

#### 1. Code Splitting
```typescript
// next.config.ts
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization.splitChunks.cacheGroups = {
      // Separate vendor bundles
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
      },
      // Separate heavy libraries
      monaco: {
        test: /monaco-editor/,
        name: 'monaco',
        priority: 20,
      },
    };
  }
  return config;
};
```

#### 2. Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image';

export default function ProblemCard({ problem }) {
  return (
    <Image
      src={problem.image}
      alt={problem.title}
      width={400}
      height={300}
      placeholder="blur"
      priority={false}
    />
  );
}
```

#### 3. Lazy Loading
```typescript
// Load Monaco editor only when needed
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { loading: () => <div>Loading editor...</div> }
);
```

#### 4. API Route Optimization
```typescript
// Use ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProblemsPage() {
  const problems = await fetch('/api/problems', {
    next: { revalidate: 60 }
  });
  // ...
}
```

---

## Dashboards & Tools

### 1. Recommended Monitoring Stack

**Free Tier:**
- ✅ Render Dashboard (built-in)
- ✅ Vercel Analytics (built-in)
- ✅ MongoDB Atlas Dashboard (built-in)
- ✅ UptimeRobot (free tier)
- ✅ K6 Load Testing (open source)

**Paid/Advanced:**
- New Relic APM ($99+/month)
- DataDog ($15+/month)
- Dynatrace ($500+/month)
- Sentry Error Tracking ($29+/month)

### 2. DIY Dashboard

Create custom dashboard with:
```bash
# Backend metrics endpoint
GET /api/metrics
{
  "uptime": 86400,
  "connections": {
    "active": 450,
    "peak": 512,
    "total": 50000
  },
  "database": {
    "poolUsage": 0.65,
    "queryTime": 45,
    "errors": 0
  },
  "api": {
    "requestCount": 100000,
    "errorRate": 0.001,
    "p95ResponseTime": 150
  }
}
```

Visualize with:
- Grafana (open source)
- Kibana (open source)
- Apache Superset (open source)

### 3. Error Tracking with Sentry (Optional)

```bash
# Install
npm install --save @sentry/nextjs

# Configure
# frontend/src/pages/_app.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://xxx@xxx.ingest.sentry.io/123456",
  tracesSampleRate: 0.1,
  environment: "production",
});
```

---

## Weekly Performance Report Template

```
📊 CodingCON Performance Report — Week of August 9, 2026

UPTIME
├── Backend: 99.98% ✓
├── Frontend: 99.99% ✓
└── Database: 99.97% ✓

PERFORMANCE
├── API p95: 145ms ✓
├── FCP: 1.2s ✓
├── LCP: 2.0s ✓
├── CLS: 0.05 ✓
└── Error Rate: 0.08% ✓

USERS & TRAFFIC
├── Peak Concurrent: 487 users
├── Total Requests: 5.2M
├── Total WebSocket Connections: 12K
└── Submissions Processed: 2.8K

COSTS
├── Render: $12.50 (1x Standard instance)
├── Vercel: $0 (within free tier)
├── MongoDB: $57.00 (M10 cluster)
├── CloudAMQP: $9.95 (Little Lemur)
└── Total: $79.45/week

ALERTS
├── High Response Time (resolved): 1
├── Database Connection Warning: 0
└── Critical Issues: 0

OPTIMIZATION COMPLETED
├── Added MongoDB index on submissions.createdAt
├── Implemented leaderboard Redis caching
├── Split Monaco editor bundle
└── Upgraded to Node.js 20.11

NEXT WEEK FOCUS
├── Load test with 750+ concurrent users
├── Add metrics endpoint
├── Implement error tracking
└── Optimize database queries
```

---

## Troubleshooting Performance Issues

### Slow API Responses (> 200ms)

**Diagnose:**
```bash
# 1. Check server logs
Render → Logs → Filter "duration"

# 2. Check database performance
MongoDB Atlas → Metrics → Query Performance

# 3. Check connection pool
Backend logs → "DB Pool" usage percentage

# 4. Run load test
k6 run load-test.js --vus 100 --duration 5m
```

**Solutions:**
1. Increase database connection pool: `DB_POOL_SIZE=80`
2. Add Redis caching for frequent queries
3. Optimize database indexes
4. Scale to higher Render plan

### High Memory Usage

**Diagnose:**
```bash
# Check logs for memory warnings
Render → Logs → Filter "Memory"

# Check Socket.IO stats
Backend logs → "Socket.IO Stats"
```

**Solutions:**
1. Reduce connection pool: `DB_POOL_SIZE=30`
2. Enable compression: Already enabled in production
3. Monitor for memory leaks: Use Node.js profiler
4. Increase Render instance memory (upgrade plan)

### WebSocket Connection Failures

**Diagnose:**
```bash
# Check CORS settings
curl -H "Origin: https://your-app.vercel.app" \
     https://codingcon-backend.onrender.com/api/health

# Check Socket.IO transport
DevTools → Network → WS tab
```

**Solutions:**
1. Verify CORS_ORIGIN on Render matches Vercel URL
2. Check firewall/proxy not blocking WebSocket upgrade
3. Verify Socket.IO transports: `['websocket', 'polling']`

---

**Last Updated**: August 2026  
**Version**: 1.0 (Production Ready)
