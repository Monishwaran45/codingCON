# CodingCON Deployment Checklist
## Complete Pre-Launch Verification (500+ Concurrent Users)

---

## 📋 Pre-Deployment Phase

### GitHub & Repository Setup
- [ ] Repository is public or private with correct access
- [ ] All code committed and pushed to `main` branch
- [ ] `.env` files added to `.gitignore`
- [ ] Sensitive data not hardcoded anywhere
- [ ] `.gitignore` includes: `node_modules/`, `.env`, `.next/`, `dist/`
- [ ] README.md updated with deployment instructions
- [ ] GitHub 2FA enabled
- [ ] Deploy keys generated for Render/Vercel

### Dependencies Verified
- [ ] Backend: `npm install` succeeds locally
- [ ] Frontend: `npm install` succeeds locally
- [ ] Backend build: `npm run build` succeeds locally
- [ ] Frontend build: `npm run build` succeeds locally
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings resolved (or configured)
- [ ] No security vulnerabilities: `npm audit` clean

### Environment Configuration
- [ ] MongoDB Atlas cluster created (production)
- [ ] MongoDB user created with strong password
- [ ] MongoDB IP whitelist configured (allow Render IP)
- [ ] JWT_SECRET generated: `openssl rand -hex 32`
- [ ] CRON_SECRET generated: `openssl rand -hex 32`
- [ ] `.env.production.example` created with template
- [ ] All required env vars documented
- [ ] Optional services evaluated:
  - [ ] RabbitMQ (CloudAMQP or LavinMQ)
  - [ ] Redis (Upstash or Redis Cloud)

---

## 🚀 Backend Deployment (Render)

### Render Account Setup
- [ ] Render account created
- [ ] GitHub connected to Render
- [ ] 2FA enabled on Render
- [ ] Payment method verified

### Service Configuration
- [ ] Project name: `codingcon-backend`
- [ ] Root directory: `backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm run start`
- [ ] Plan: Standard (for production)
- [ ] Region: Closest to users (Singapore, Mumbai, Frankfurt, etc.)
- [ ] Auto-deploy: Enabled (from main branch)

### Environment Variables Set
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `4000`
- [ ] `CLUSTER_ENABLED` = `true`
- [ ] `WORKERS` = `4` (or auto-detect)
- [ ] `MONGODB_URI` = `mongodb+srv://...`
- [ ] `JWT_SECRET` = (generated, 64 chars+)
- [ ] `CORS_ORIGIN` = (will update after Vercel deployment)
- [ ] `CRON_SECRET` = (generated, 64 chars+)
- [ ] `DB_POOL_SIZE` = `50`
- [ ] `DB_MIN_POOL_SIZE` = `10`
- [ ] `MAX_JUDGE_JOBS` = `4`
- [ ] `QUEUE_CONCURRENCY` = `2`
- [ ] Optional: `RABBITMQ_URL` if using RabbitMQ
- [ ] Optional: `REDIS_URL` if using Redis

### Deployment Verification
- [ ] Build completed successfully (< 10 min)
- [ ] No build errors in logs
- [ ] Service shows "Live" status
- [ ] Deploy URL generated: `https://codingcon-backend.onrender.com`
- [ ] Health check passes: `curl https://codingcon-backend.onrender.com/api/health`
- [ ] Response includes: `"status":"ok"`, `"database":"mongodb"`

---

## 🎨 Frontend Deployment (Vercel)

### Vercel Account Setup
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] 2FA enabled on Vercel
- [ ] Payment method verified

### Project Configuration
- [ ] Project name: `codingcon`
- [ ] Framework: Next.js (auto-detected)
- [ ] Build command: `next build` (auto-filled)
- [ ] Output directory: `.next` (auto-filled)
- [ ] Node version: 20.x or higher

### Environment Variables Set
- [ ] `NEXT_PUBLIC_API_BASE_URL` = `https://codingcon-backend.onrender.com/api`
- [ ] `NEXT_PUBLIC_WS_BASE_URL` = `https://codingcon-backend.onrender.com`
- [ ] `BACKEND_URL` = `https://codingcon-backend.onrender.com`
- [ ] `CRON_SECRET` = (same as backend)
- [ ] `NODE_ENV` = `production`

### Deployment Verification
- [ ] Build completed successfully (< 5 min)
- [ ] No build errors in logs
- [ ] Project shows "Deployed" status
- [ ] Deploy URL generated: `https://your-app.vercel.app`
- [ ] Production deployment shows green status
- [ ] Previous deployments available for rollback

---

## 🔗 Integration Verification

### Backend ↔ Frontend Connection
- [ ] Frontend homepage loads without errors
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows API requests succeeding
- [ ] API calls returning correct data

### Update Backend CORS
- [ ] Go to Render backend settings
- [ ] Update `CORS_ORIGIN` = `https://your-app.vercel.app`
- [ ] Save and verify auto-redeploy
- [ ] Service status returns to "Live"

### WebSocket Connection
- [ ] Open DevTools → Console
- [ ] Socket.IO client connects successfully
- [ ] No connection errors in console
- [ ] Real-time events working (test with leaderboard updates)
- [ ] Test subscription: `subscribe:leaderboard`, `subscribe:submission`

---

## 🧪 Functional Testing

### Authentication Flow
- [ ] Registration page loads
- [ ] Registration with valid data succeeds
- [ ] Registration with invalid data shows error
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails
- [ ] Logout clears session
- [ ] Authenticated user can access protected pages
- [ ] Unauthenticated user redirected to login

### Core Features
- [ ] Problems page loads with list
- [ ] Problem details page shows correctly
- [ ] Can read problem description and test cases
- [ ] Contests page shows active contests
- [ ] Leaderboard updates in real-time
- [ ] Can submit code (if judge configured)
- [ ] Submission status updates via WebSocket
- [ ] User profile page loads with stats

### Real-Time Features
- [ ] WebSocket connection persists
- [ ] Leaderboard updates reflected immediately
- [ ] Submission updates received instantly
- [ ] Announcements broadcast to all users
- [ ] Switching tabs doesn't disconnect

### Edge Cases
- [ ] Network disconnection recovery works
- [ ] Long-running submissions handled correctly
- [ ] Concurrent submissions don't conflict
- [ ] Large code submissions accepted
- [ ] Unicode input handled correctly
- [ ] Browser refresh maintains session

---

## 📊 Performance Testing

### Backend Performance
- [ ] Health check response time: < 50ms
- [ ] API response times: p95 < 200ms
- [ ] Database queries: < 50ms
- [ ] No connection pool warnings
- [ ] Memory usage stable (not growing)
- [ ] CPU usage reasonable (< 50%)

### Frontend Performance
- [ ] First Contentful Paint (FCP): < 1.5s
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] Time to Interactive (TTI): < 3s
- [ ] JavaScript bundle: < 150KB (gzipped)
- [ ] CSS bundle: < 30KB (minified)
- [ ] Lighthouse score: > 80

### Load Testing
- [ ] Backend handles 100 concurrent users smoothly
- [ ] Backend handles 500 concurrent users without errors
- [ ] Error rate remains < 0.1% at 500 users
- [ ] Response times acceptable at full load
- [ ] No timeouts or connection failures
- [ ] Database connection pool doesn't exhaust

---

## 🔐 Security Verification

### Secrets Management
- [ ] No `.env` files in Git history
- [ ] All secrets in Render environment variables (not hardcoded)
- [ ] JWT_SECRET is random and strong (64+ chars)
- [ ] CRON_SECRET is random and strong (64+ chars)
- [ ] Database password is strong and unique
- [ ] API keys not exposed in logs or console
- [ ] No secrets in GitHub issues or PRs

### API Security
- [ ] HTTPS enforced (automatic on Vercel/Render)
- [ ] CORS correctly configured (whitelist Vercel domain)
- [ ] Rate limiting active on auth endpoints
- [ ] Rate limiting active on submission endpoints
- [ ] XSS protection headers present
- [ ] CSRF protection enabled (if applicable)
- [ ] SQL injection prevention (using ORM)
- [ ] Input validation on all endpoints
- [ ] No sensitive data in error messages

### Infrastructure Security
- [ ] MongoDB IP whitelist restricts access
- [ ] 2FA enabled on GitHub, Vercel, Render
- [ ] SSH keys stored securely (not in repo)
- [ ] Render deploy key has limited scope
- [ ] Vercel tokens have limited scope
- [ ] No hardcoded credentials anywhere
- [ ] Render service logs don't expose secrets

### HTTPS & TLS
- [ ] Backend uses HTTPS (automatic on Render)
- [ ] Frontend uses HTTPS (automatic on Vercel)
- [ ] SSL certificate valid and not self-signed
- [ ] No mixed content (HTTP + HTTPS)
- [ ] TLS 1.2+ enforced

---

## 📈 Monitoring & Alerting

### Monitoring Setup
- [ ] Render dashboard accessible
- [ ] Vercel analytics accessible
- [ ] MongoDB Atlas dashboard accessible
- [ ] Health check endpoint responding
- [ ] Logs streaming properly

### Alerts Configured
- [ ] UptimeRobot monitoring backend health
- [ ] Slack notifications enabled (optional)
- [ ] Email alerts configured
- [ ] Error rate threshold set (> 1%)
- [ ] Response time threshold set (> 500ms)
- [ ] Memory usage threshold set (> 80%)

### Dashboards Created
- [ ] Render metrics dashboard viewed
- [ ] Vercel analytics dashboard accessible
- [ ] Custom metrics endpoint ready (optional)
- [ ] Status page created (optional)

---

## 📝 Documentation & Runbooks

### Documentation Complete
- [ ] PRODUCTION_DEPLOYMENT.md reviewed
- [ ] DEPLOY_QUICK_START.md reviewed
- [ ] MONITORING_AND_PERFORMANCE.md reviewed
- [ ] VERCEL_DEPLOYMENT.md reviewed
- [ ] README.md updated with live links
- [ ] Deployment steps documented
- [ ] Rollback procedure documented
- [ ] Incident response plan created

### Runbooks Created
- [ ] "How to deploy a new version" written
- [ ] "How to rollback" written
- [ ] "How to scale up" written
- [ ] "How to debug issues" written
- [ ] "Emergency contacts" listed
- [ ] "Common errors" documented with solutions

---

## 🎯 Pre-Launch Final Checks (24 Hours Before)

### Code Quality
- [ ] All tests passing (if applicable)
- [ ] No console errors or warnings (production mode)
- [ ] ESLint/TypeScript errors resolved
- [ ] Code reviewed by team member
- [ ] No hardcoded test data in production

### Performance Validation
- [ ] Load test with 500 concurrent users passed
- [ ] Response times acceptable
- [ ] Error rate acceptable
- [ ] Memory/CPU usage acceptable
- [ ] Database performance verified

### Content & Assets
- [ ] All images optimized
- [ ] Favicon configured
- [ ] Metadata/SEO tags correct
- [ ] Privacy policy linked (if applicable)
- [ ] Terms of service linked (if applicable)
- [ ] About/Help pages present (if applicable)

### Final Smoke Tests
- [ ] Can register new user
- [ ] Can login as user
- [ ] Can view problems
- [ ] Can view contests
- [ ] Can submit code (if applicable)
- [ ] Real-time leaderboard updates
- [ ] Mobile responsive layout works
- [ ] Dark mode toggle works
- [ ] All navigation links work
- [ ] No 404 errors on main pages

### Communication
- [ ] Team notified of launch time
- [ ] Support team briefed
- [ ] Escalation contacts shared
- [ ] Incident response plan reviewed
- [ ] Status page updated
- [ ] Social media posts scheduled (optional)

---

## 🚀 Launch Day

### Pre-Launch (1 Hour Before)
- [ ] All systems operational
- [ ] No active alarms or warnings
- [ ] Team members online and ready
- [ ] Incident response team available
- [ ] Communication channels open

### Launch (Go Live)
- [ ] Announce deployment in team channel
- [ ] Monitor logs for errors
- [ ] Monitor metrics dashboard
- [ ] Be ready to rollback if needed

### Post-Launch (30 Minutes After)
- [ ] Check all core functionality working
- [ ] Verify no spike in error rates
- [ ] Confirm real-time features active
- [ ] Test with actual production data
- [ ] Announce successful deployment

### Post-Launch (1-2 Hours After)
- [ ] Monitor for any issues
- [ ] Check performance metrics stable
- [ ] No unusual error patterns
- [ ] Database performance good
- [ ] WebSocket connections stable

---

## 📋 Post-Launch Monitoring

### First Week
- [ ] Daily check of metrics
- [ ] Review error logs
- [ ] Monitor performance trends
- [ ] Gather user feedback
- [ ] Document any issues
- [ ] Plan optimization

### First Month
- [ ] Weekly performance report
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Documentation updates
- [ ] Team retrospective
- [ ] Optimization implementations

---

## ✅ Sign-Off

**Prepared By:** _____________________ Date: _______

**Reviewed By:** _____________________ Date: _______

**Approved By:** _____________________ Date: _______

**Deployed By:** _____________________ Date: _______

---

## 📞 Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Product Owner | | | |
| Technical Lead | | | |
| DevOps/Infrastructure | | | |
| On-Call Support | | | |

## 🔗 Important Links

- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- MongoDB Atlas: https://cloud.mongodb.com
- GitHub Repository: 
- Production Frontend: 
- Production Backend: 
- Monitoring Dashboard: 
- Status Page: 

---

**Version**: 1.0  
**Last Updated**: August 2026  
**Next Review**: After first successful deployment
