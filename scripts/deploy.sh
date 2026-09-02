#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "  Sunita's Collection - Node Deployment Script"
echo "================================================"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# --- 1. Install server dependencies (production) ---
echo ""
echo "[1/5] Installing server dependencies..."
if [ -f "server/package.json" ]; then
  (cd server && npm ci --omit=dev 2>/dev/null || npm install --omit=dev)
  echo "      Server dependencies installed."
else
  echo "      ERROR: server/package.json not found."
  exit 1
fi

# --- 2. Install client dependencies ---
echo ""
echo "[2/5] Installing client dependencies..."
if [ -f "client/package.json" ]; then
  (cd client && npm install 2>/dev/null || npm install)
  echo "      Client dependencies installed."
else
  echo "      ERROR: client/package.json not found."
  exit 1
fi

# --- 3. Build client for production ---
echo ""
echo "[3/5] Building client..."
(cd client && npm run build)
echo "      Client build complete: client/dist/"

# --- 4. Ensure uploads directory exists ---
echo ""
echo "[4/5] Preparing uploads directory..."
mkdir -p server/uploads
echo "      uploads/ ready."

# --- 5. Start / reload with PM2 ---
echo ""
echo "[5/5] Starting / reloading PM2 process..."
if ! command -v pm2 &>/dev/null; then
  echo "      PM2 not found. Installing PM2 globally..."
  npm install -g pm2
fi

if pm2 describe sunitas-collection-api &>/dev/null; then
  echo "      Reloading existing process..."
  pm2 reload server/ecosystem.config.cjs --env production
else
  echo "      Starting new process..."
  pm2 start server/ecosystem.config.cjs --env production
fi

echo ""
echo "================================================"
echo "  Deployment complete!"
echo "================================================"
echo ""
echo "  API server:  http://localhost:${PORT:-5000}"
echo "  Client build: $(pwd)/client/dist/"
echo "  PM2 logs:    pm2 logs sunitas-collection-api"
echo "  PM2 status:  pm2 ls"
echo ""
pm2 ls
