#!/usr/bin/env bash
# Forkcast 2.0 one-time setup (WSL).
# Easiest way to run it, from anywhere in WSL:
#   cd ~ && unzip -o "$(ls -t /mnt/c/Users/*/Downloads/forkcast-v2*.zip | head -1)" && cd forkcast-v2 && bash scripts/setup.sh
#
# What it does:
#   1. Checks your tools and installs the Firebase CLI if needed
#   2. Signs you in to Firebase and GitHub
#   3. Creates a Firebase project, a web app, and the Firestore database
#   4. Publishes the security rules and turns on anonymous sign-in
#   5. Writes web/firebase-config.js
#   6. Creates the GitHub repo, turns on GitHub Pages, and publishes the app
#
# Options (put them before the command):
#   FIREBASE_PROJECT=my-project-id   use a Firebase project you already made
#   REPO_NAME=forkcast               GitHub repo name (default: forkcast)
#   FIRESTORE_LOCATION=nam5          database location (default: nam5, United States)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/.forkcast.env"
REPO_NAME="${REPO_NAME:-forkcast}"
LOCATION="${FIRESTORE_LOCATION:-nam5}"

bold() { printf '\n\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
die()  { printf '\n\033[31mStopped:\033[0m %s\n' "$*" >&2; exit 1; }
pause() { read -r -p "  Press Enter when done... " _; }
save_env() {
  touch "$ENV_FILE"
  grep -v "^$1=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
  echo "$1=$2" >> "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
}
[ -f "$ENV_FILE" ] && source "$ENV_FILE"
FIREBASE_PROJECT="${FIREBASE_PROJECT:-}"
VERSION="$(grep -oE "APP_VERSION = '[^']+'" web/index.html | grep -oE "[0-9][0-9.]*")"

# ---------- 1. Tools ----------
bold "1/6  Checking tools"
command -v git >/dev/null  || die "git is missing. Run: sudo apt update && sudo apt install -y git"
command -v curl >/dev/null || die "curl is missing. Run: sudo apt install -y curl"
command -v node >/dev/null || die "Node.js is missing. Install Node 20+: https://github.com/nvm-sh/nvm (then: nvm install --lts)"
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || die "Node 20 or newer is needed. Run: nvm install --lts"
command -v gh >/dev/null   || die "GitHub CLI (gh) is missing. Install: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
if ! command -v firebase >/dev/null; then
  info "Installing the Firebase CLI..."
  npm install -g firebase-tools || die "Couldn't install firebase-tools."
fi
info "node $(node -v), firebase $(firebase --version), $(gh --version | head -1)"
if [ -z "${BROWSER:-}" ] && command -v wslview >/dev/null; then export BROWSER=wslview; fi

# ---------- 2. Sign-ins ----------
bold "2/6  Signing in"
if ! firebase projects:list >/dev/null 2>&1; then
  info "Signing in to Firebase. If no browser opens, copy the link it prints into Chrome."
  firebase login || firebase login --no-localhost || die "Firebase sign-in didn't finish."
else
  info "Firebase: already signed in."
fi
if ! gh auth status >/dev/null 2>&1; then
  gh auth login -w -p https || die "GitHub sign-in didn't finish."
fi
OWNER="$(gh api user -q .login)"
info "GitHub: signed in as $OWNER."
[ -n "$(git config --global user.name || true)" ]  || { read -r -p "  Your name for git commits: " x; git config --global user.name "$x"; }
[ -n "$(git config --global user.email || true)" ] || { read -r -p "  Your email for git commits: " x; git config --global user.email "$x"; }

# ---------- 3. Firebase project, app, database ----------
bold "3/6  Setting up Firebase"
if [ -z "$FIREBASE_PROJECT" ]; then
  FIREBASE_PROJECT="forkcast-$(node -e 'const c="abcdefghijkmnpqrstuvwxyz23456789";let s="";for(const b of require("crypto").randomBytes(5))s+=c[b%c.length];console.log(s)')"
  info "Creating Firebase project $FIREBASE_PROJECT ..."
  firebase projects:create "$FIREBASE_PROJECT" --display-name "Forkcast" \
    || die "Couldn't create the project. You can make one at https://console.firebase.google.com and rerun with FIREBASE_PROJECT=<its id>."
fi
save_env FIREBASE_PROJECT "$FIREBASE_PROJECT"
printf '{\n  "projects": { "default": "%s" }\n}\n' "$FIREBASE_PROJECT" > .firebaserc

if [ -z "${FIREBASE_APP_ID:-}" ]; then
  info "Registering the Forkcast web app..."
  OUT="$(firebase apps:create WEB "Forkcast" --project "$FIREBASE_PROJECT" 2>&1)" || die "Couldn't create the web app: $OUT"
  FIREBASE_APP_ID="$(printf '%s' "$OUT" | grep -oE '1:[0-9]+:web:[0-9a-f]+' | head -1)"
  [ -n "$FIREBASE_APP_ID" ] || die "Couldn't read the app ID. Output was: $OUT"
fi
save_env FIREBASE_APP_ID "$FIREBASE_APP_ID"

info "Creating the Firestore database ($LOCATION)..."
firebase firestore:databases:create "(default)" --location "$LOCATION" --project "$FIREBASE_PROJECT" >/dev/null 2>&1 \
  && info "Database created." \
  || info "Database already exists (or create it once at https://console.firebase.google.com/project/$FIREBASE_PROJECT/firestore)."

# ---------- 4. Rules + anonymous sign-in ----------
bold "4/6  Publishing security rules and turning on anonymous sign-in"
if ! firebase deploy --only firestore,auth --project "$FIREBASE_PROJECT" --non-interactive; then
  info "Rules or sign-in didn't publish. Do these two clicks, then press Enter:"
  info "  1. https://console.firebase.google.com/project/$FIREBASE_PROJECT/firestore  (Create database, if asked)"
  info "  2. https://console.firebase.google.com/project/$FIREBASE_PROJECT/authentication/providers  (Anonymous > Enable)"
  pause
  firebase deploy --only firestore --project "$FIREBASE_PROJECT" --non-interactive || die "Rules still didn't publish."
fi

# ---------- 5. App config ----------
bold "5/6  Connecting the app to Firebase"
CONFIG_JSON="$(firebase apps:sdkconfig WEB "$FIREBASE_APP_ID" --project "$FIREBASE_PROJECT" --json 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const c=(j.result&&(j.result.sdkConfig||j.result))||{};process.stdout.write(JSON.stringify(c))}catch(e){}})')"
if [ -z "$CONFIG_JSON" ] || [ "$CONFIG_JSON" = "{}" ]; then
  CONFIG_JSON="$(firebase apps:sdkconfig WEB "$FIREBASE_APP_ID" --project "$FIREBASE_PROJECT" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=s.indexOf("{"),b=s.lastIndexOf("}");process.stdout.write(a>=0?JSON.stringify(JSON.parse(s.slice(a,b+1))):"")})')"
fi
echo "$CONFIG_JSON" | grep -q apiKey || die "Couldn't read the Firebase web config."
cat > web/firebase-config.js <<EOF
// Forkcast Firebase settings (written by scripts/setup.sh).
// These values are safe to publish: Firestore security rules protect the data.
window.FORKCAST_FIREBASE = $CONFIG_JSON;
EOF
info "Saved web/firebase-config.js"
info "Checking that sign-in works..."
until bash scripts/check-auth.sh; do
  info "Do the fix above in your browser, then press Enter to check again (or Ctrl+C to stop)."
  pause
done

# ---------- 6. GitHub ----------
bold "6/6  Publishing on GitHub Pages"
node scripts/build-docs.mjs
[ -d .git ] || git init -q -b main
git add -A
git commit -q -m "Forkcast v$VERSION" || true
if ! git remote get-url origin >/dev/null 2>&1; then
  if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
    info "You already have a repo named $REPO_NAME (probably Forkcast 1.x)."
    read -r -p "  Rename it to $REPO_NAME-v1 and keep it as a backup? [Y/n] " ans
    if [ "${ans:-Y}" != "n" ] && [ "${ans:-Y}" != "N" ]; then
      gh repo rename "$REPO_NAME-v1" -R "$OWNER/$REPO_NAME" --yes || die "Rename failed. Rerun with REPO_NAME=forkcast2"
      info "Old version is now at https://github.com/$OWNER/$REPO_NAME-v1"
      sleep 3
    else
      REPO_NAME="$REPO_NAME-v2"; info "Using $REPO_NAME instead."
    fi
  fi
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --description "Forkcast: swipe to decide what to eat" \
    || die "Couldn't create the GitHub repo."
fi
REPO_SLUG="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
save_env REPO_SLUG "$REPO_SLUG"
gh api -X POST "repos/$REPO_SLUG/pages" -f build_type=workflow >/dev/null 2>&1 \
  || gh api -X PUT "repos/$REPO_SLUG/pages" -f build_type=workflow >/dev/null 2>&1 \
  || info "Turn on Pages by hand: repo Settings > Pages > Source: GitHub Actions."
git push -u origin main
SITE="$(echo "https://${REPO_SLUG%%/*}.github.io/${REPO_SLUG##*/}/" | tr '[:upper:]' '[:lower:]')"
save_env SITE_URL "$SITE"
git add -A && git commit -q -m "Save setup info" && git push -q || true

bold "Done. Forkcast v$VERSION is publishing."
info "App:       $SITE   (live in about a minute; watch with: gh run watch)"
info "Repo:      https://github.com/$REPO_SLUG"
info "Firebase:  https://console.firebase.google.com/project/$FIREBASE_PROJECT"
info "Updates:   bash scripts/deploy.sh"
