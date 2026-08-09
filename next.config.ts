import type { NextConfig } from 'next';

const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/+$/, '') ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, '').replace(/\/+$/, '') ??
  'http://localhost:4000';

const nextConfig: NextConfig = {
  // ── Turbopack: silence the workspace-root warning ──────────────────────────
  turbopack: {
    root: __dirname,
  },

  // ── API + WebSocket proxy ──────────────────────────────────────────────────
  // Rewrites all /api/* and /socket.io/* requests to the Express backend.
  // This means the browser only ever talks to localhost:3000, so
  // credentials (httpOnly cookies) work without cross-origin issues.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
