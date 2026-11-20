#!/usr/bin/env bash
# Confirms Firebase anonymous sign-in works for this app (used by setup.sh and deploy.sh).
# Exits 0 if it works, 1 if not, with the exact console link to fix it.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEY="$(node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const m=s.match(/"apiKey"\s*:\s*"([^"]+)"/);process.stdout.write(m?m[1]:"")' "$ROOT/web/firebase-config.js")"
PROJECT="$(node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const m=s.match(/"projectId"\s*:\s*"([^"]+)"/);process.stdout.write(m?m[1]:"")' "$ROOT/web/firebase-config.js")"
if [ -z "$KEY" ]; then echo "  web/firebase-config.js is empty. Run: bash scripts/setup.sh"; exit 1; fi
RES="$(curl -s --max-time 20 -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$KEY" \
  -H 'Content-Type: application/json' -d '{"returnSecureToken":true}')"
if printf '%s' "$RES" | grep -q '"idToken"'; then
  echo "  Sign-in check: OK"
  exit 0
fi
REASON="$(printf '%s' "$RES" | grep -oE '"message": *"[^"]+"' | head -1 | sed 's/.*: *"//;s/"$//')"
echo "  Sign-in check FAILED (${REASON:-no answer})."
echo "  Fix: open https://console.firebase.google.com/project/$PROJECT/authentication/providers"
echo "       click Get started if you see it, then Anonymous > Enable > Save."
exit 1
