# Vercel Frontend Deployment Guide

## Performance Optimizations Implemented

### 1. Code Splitting & Bundling
- **Vendor Chunks**: Separates `node_modules` into dedicated vendor bundle
- **Socket.IO Isolation**: Socket.IO client in separate chunk for lazy loading
- **Monaco Editor**: Code editor bundled separately to avoid main bundle bloat
- **Tree Shaking**: Unused code automatically removed during build

### 2. Image & Static Asset Optimization
- **AVIF Format**: Modern image format with 20-30% smaller file sizes
- **WebP Fallback**: Automatic format selection based on browser support
- **Image Sizes**: Optimized for mobile (640px), tablet (1080px), and desktop (1920px+)
- **Cache Control**: 1-year cache TTL for static assets (immutable)

### 3. HTTP/2 & Compression
- **Gzip**: Automatic response compression for text/JSON
- **Brotli**: Better compression for text (Vercel default)
- **Min-CSS**: Minified CSS delivered
- **JS Minification**: All JavaScript minified and tree-shaken

### 4. Caching Strategy
```
Static Assets (/public, /_next/static/):
  Cache-Control: max-age=31536000, immutable (1 year)

API Requests (/api):
  Cache-Control: no-cache, no-store, must-revalidate (no caching)

Server Components:
  Automatic ISR (Incremental Static Regeneration) where applicable
```

### 5. Security Headers
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: XSS attack mitigation
- **Referrer-Policy**: Controls referrer information

### 6. Server-Side Rendering (SSR) Benefits
- **Faster First Paint**: HTML rendered on server
- **SEO Friendly**: Full content available for search engines
- **Security**: API keys kept on server only
- **Cookie Support**: HttpOnly cookies work via server rewrites

## Deployment Steps

### 1. Prepare Environment Variables
```bash
# Create .env.production file with:
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_WS_BASE_URL=https://your-backend.onrender.com
BACKEND_URL=https://your-backend.onrender.com
CRON_SECRET=your-secure-cron-secret-key
```

### 2. Deploy to Vercel
```bash
# Option 1: Git Integration (Recommended)
# - Connect GitHub repo to Vercel dashboard
# - Automatic deployments on push to main
# - Pull request previews

# Option 2: Vercel CLI
vercel --prod --env-file .env.production
```

### 3. Set Environment Variables in Vercel Dashboard
1. Go to Project Settings → Environment Variables
2. Add for all environments (Production, Preview, Development):
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_WS_BASE_URL`
   - `BACKEND_URL`
   - `CRON_SECRET`

### 4. Configure Custom Domain (Optional)
1. In Vercel dashboard → Domains
2. Add your custom domain
3. Follow DNS configuration steps

## Performance Metrics

Expected performance with 500+ concurrent users:

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **JavaScript Bundle**: < 150KB (gzipped)
- **CSS Bundle**: < 30KB (minified)

## Monitoring & Debugging

### Vercel Analytics
- Real User Monitoring (RUM) enabled by default
- View Web Vitals at: Project Dashboard → Analytics

### Next.js Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run build
```

### Network Tab Inspection
1. Open DevTools → Network
2. Check:
   - Bundle size (should be < 150KB for JS)
   - Cache headers on static assets
   - API response times (should be < 200ms)

## Auto-Scaling Features

Vercel automatically handles:
- **Horizontal Scaling**: Distributes load across multiple instances
- **Edge Network**: Content served from 300+ global edge locations
- **Automatic HTTP/2 Push**: Optimized resource delivery
- **DDoS Protection**: Built-in protection included
- **CDN Caching**: Automatic caching of static content

## Common Issues & Solutions

### Issue: Images not loading
**Solution**: Check Image Optimization settings in next.config.ts, ensure image domains are whitelisted

### Issue: WebSocket connection fails
**Solution**: Ensure `NEXT_PUBLIC_WS_BASE_URL` points to correct backend, check CORS on backend

### Issue: Build fails with memory error
**Solution**: Increase vercel.json functions memory to 3008MB for large builds

### Issue: Cold start latency
**Solution**: This is normal, Vercel keeps functions warm with scheduled pings, no action needed

## Cost Optimization Tips

1. **Image Optimization**: Use `<Image>` component instead of `<img>`
2. **Code Splitting**: Lazy load heavy components with `dynamic()`
3. **API Routes**: Use Edge Functions for low-latency API calls
4. **ISR**: Regenerate static pages periodically instead of on-demand

## Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Backend URL verified and accessible
- [ ] WebSocket connection tested in browser console
- [ ] API rewrites working (test with `/api/health`)
- [ ] Images loading correctly
- [ ] Dark mode toggling works
- [ ] Socket.IO events firing correctly
- [ ] Build time < 5 minutes
- [ ] Lighthouse score > 80
- [ ] No console errors in production

---

For more information, see: [Next.js Deployment Docs](https://nextjs.org/docs/deployment/vercel)
