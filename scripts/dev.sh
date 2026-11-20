#!/usr/bin/env bash
# Preview Forkcast locally (WSL):  bash scripts/dev.sh
# Then open http://localhost:8080 in Chrome or Edge on Windows.
# It uses your real Firebase data.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-8080}"
echo "Forkcast preview: http://localhost:$PORT   (Ctrl+C to stop)"
python3 -m http.server "$PORT" --directory "$ROOT/web"
