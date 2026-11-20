#!/usr/bin/env bash
# Publish Forkcast changes (WSL):
#   bash scripts/deploy.sh               rules + app + docs
#   bash scripts/deploy.sh --web         app + docs only (skip Firebase rules)
#   bash scripts/deploy.sh -m "note"     add a note to the commit
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
[ -f .forkcast.env ] || { echo "Run bash scripts/setup.sh first."; exit 1; }
source .forkcast.env

WEB_ONLY=0; MSG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --web) WEB_ONLY=1 ;;
    -m) shift; MSG="${1:-}" ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

VERSION="$(grep -oE "APP_VERSION = '[^']+'" web/index.html | grep -oE "[0-9][0-9.]*")"
echo "Deploying Forkcast v$VERSION"

if [ "$WEB_ONLY" = "0" ]; then
  echo "  Publishing security rules and indexes..."
  firebase deploy --only firestore --project "$FIREBASE_PROJECT" --non-interactive
fi

echo "  Updating HANDOFF.md and FEATURES.md..."
node scripts/build-docs.mjs

git add -A
if git diff --cached --quiet; then
  echo "  Nothing new to publish."
else
  git commit -q -m "Forkcast v$VERSION${MSG:+: $MSG}"
  git push -q
  echo "  Pushed. GitHub Pages updates in about a minute (gh run watch)."
fi
echo "App: ${SITE_URL:-see Settings > Pages in your repo}"
