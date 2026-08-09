# CodingCON Production Deployment Guide

This guide details step-by-step how to deploy **CodingCON**:
- **Frontend**: Next.js App deployed to **Vercel**
- **Backend**: Express + Node.js REST API & WebSocket server deployed to **Render**
- **Cron Jobs**: Automated ping & sync jobs configured via **Vercel Cron** and/or **Render Cron**

---

## 1. Backend Deployment (Render)

### Step 1: Create Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Set the following settings:
   - **Name**: `codingcon-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

### Step 2: Set Environment Variables on Render
Under **Environment Variables** in your Render Web Service settings, add:

| Key | Example / Value | Description |
| --- | --- | --- |
| `PORT` | `4000` | Port for Express server |
| `NODE_ENV` | `production` | Production environment mode |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/codingcon` | Production MongoDB Atlas Connection URI |
| `JWT_SECRET` | `your-secure-random-secret-key` | High-entropy secret for signing Auth JWTs |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | Allowed Vercel Frontend origin (or comma-separated URLs) |
| `CRON_SECRET` | `your-cron-secret-key` | Optional secret key for securing `/api/cron` |
| `REDIS_URL` | *(Optional)* `redis://default:pass@redis-host:6379` | Remote Redis URL (Upstash or Redis Cloud) |
| `RABBITMQ_URL` | *(Optional)* `amqp://user:pass@cloudamqp-host:5672/` | Remote RabbitMQ URL (CloudAMQP or LavinMQ) |

---

## 2. Frontend Deployment (Vercel)

### Step 1: Import Project to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Import your `codingCON` Git repository.
3. Select **Next.js** framework preset (it auto-detects root `package.json`).

### Step 2: Configure Environment Variables on Vercel
In the **Environment Variables** section on Vercel, add:

| Key | Example / Value | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://codingcon-backend.onrender.com/api` | Full URL to backend REST API on Render |
| `NEXT_PUBLIC_WS_BASE_URL` | `https://codingcon-backend.onrender.com` | Full WebSocket URL to backend Socket.IO on Render |
| `BACKEND_URL` | `https://codingcon-backend.onrender.com` | Used by Next.js server rewrites & `/api/cron` proxy |
| `CRON_SECRET` | `your-cron-secret-key` | Secret key matching backend `CRON_SECRET` |

---

## 3. Automated Cron Jobs (Keep-Alive & Contest Sync)

Render free tier instances go to sleep after 15 minutes of inactivity. CodingCON is equipped with automated cron job routes to keep the backend warm and sync contest states.

Cron job execution is configured on Render natively via `render.yaml`:
```yaml
  - type: cron
    name: codingcon-backend-cron
    runtime: node
    rootDir: backend
    schedule: "*/10 * * * *"
    buildCommand: echo "Cron ready"
    startCommand: node -e "const u = (process.env.BACKEND_URL || 'http://localhost:4000') + '/api/cron'; fetch(u, { headers: process.env.CRON_SECRET ? { Authorization: 'Bearer ' + process.env.CRON_SECRET } : {} }).then(r => r.json()).then(console.error)"
```
This triggers every 10 minutes to execute `/api/cron` directly on the Render backend service.

---

## 4. Verification & Testing

1. Once deployed, test the backend health endpoint:
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
2. Test the cron endpoint:
   ```bash
   curl https://your-backend.onrender.com/api/cron
   ```
3. Open your Vercel deployment URL (`https://your-app.vercel.app`), register an account, and log in to confirm REST API and Socket.IO real-time functionality.
