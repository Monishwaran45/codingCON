#!/usr/bin/env bash
# ── Render Build Script ─────────────────────────────────────────────────────
# Installs language runtimes (g++, python3, javac) needed by the judge,
# then runs the standard Node.js build.
#
# Render's Node.js runtime uses Ubuntu — apt-get is available at build time
# and installed packages persist into the runtime environment.
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "📦 Installing language runtimes for the code judge..."

# Install compilers/runtimes — skip if already present
if ! command -v g++ &> /dev/null; then
  echo "  → Installing g++ (C++ compiler)..."
  apt-get update -qq
  apt-get install -y --no-install-recommends g++ 2>/dev/null || echo "  ⚠️ g++ install failed (non-fatal)"
fi

if ! command -v python3 &> /dev/null; then
  echo "  → Installing python3..."
  apt-get update -qq 2>/dev/null || true
  apt-get install -y --no-install-recommends python3 2>/dev/null || echo "  ⚠️ python3 install failed (non-fatal)"
fi

if ! command -v javac &> /dev/null; then
  echo "  → Installing Java JDK..."
  apt-get update -qq 2>/dev/null || true
  apt-get install -y --no-install-recommends default-jdk-headless 2>/dev/null || echo "  ⚠️ Java install failed (non-fatal)"
fi

# Clean up apt cache to reduce image size
rm -rf /var/lib/apt/lists/* 2>/dev/null || true

echo ""
echo "🔍 Installed language runtimes:"
echo "  g++:     $(g++ --version 2>/dev/null | head -1 || echo 'NOT INSTALLED')"
echo "  python3: $(python3 --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "  javac:   $(javac -version 2>/dev/null || echo 'NOT INSTALLED')"
echo "  node:    $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo ""

# Standard Node.js build
echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build complete!"
