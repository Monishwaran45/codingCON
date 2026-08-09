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

  // ── Performance Optimizations ─────────────────────────────────────────────────
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundle
  compress: true, // Enable gzip compression

  // ── Image Optimization ────────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ── Headers for Performance & Security ────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // ── API + WebSocket proxy ──────────────────────────────────────────────────
  // Rewrites all /api/* requests to the Express backend.
  // This means the browser only ever talks to Vercel domain, so
  // credentials (httpOnly cookies) work without cross-origin issues.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },

  // ── Redirects for backward compatibility ────────────────────────────────────
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/dashboard/:path*',
        destination: '/admin/:path*',
        permanent: false,
      },
    ];
  },

  // ── Webpack configuration for code splitting ────────────────────────────────
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Separate vendor code
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Separate socket.io client
        socketio: {
          test: /[\\/]node_modules[\\/](socket\.io-client)[\\/]/,
          name: 'socket-io',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Separate monaco editor
        monaco: {
          test: /[\\/]node_modules[\\/](@monaco-editor|monaco-editor)[\\/]/,
          name: 'monaco',
          priority: 20,
          reuseExistingChunk: true,
        },
      };
    }
    return config;
  },
};

export default nextConfig;

