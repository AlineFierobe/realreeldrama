#!/usr/bin/env bash
# Smoke test: starts the server in production mode (after "npm run build") and checks
# that it answers correctly. Used by GitHub Actions before each release;
# no real credentials are needed (fake Google client id, no database).
#   bash scripts/smoke-test.sh
set -euo pipefail

PORT=${PORT:-5050}
BASE="http://localhost:$PORT"
export NODE_ENV=production PORT
export GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-ci.apps.googleusercontent.com}
export ALLOWED_EMAILS=${ALLOWED_EMAILS:-ci@example.com}
export SESSION_SECRET=${SESSION_SECRET:-ci-only-session-secret-not-used-in-production}
# No database: the server starts anyway and keeps retrying to connect in the background
export MONGODB_URI=${MONGODB_URI:-mongodb://127.0.0.1:9/real-reel-drama-ci}

node server/src/index.js > smoke-server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

# Waits for the server to answer (15 s at most)
for _ in $(seq 1 30); do
  curl -s -o /dev/null "$BASE/api/health" && break
  sleep 0.5
done

FAILED=0
check() { # check <description> <expected code> <url>
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "$3")
  if [ "$code" = "$2" ]; then echo "  ok   $1 ($code)"; else echo "  FAIL $1: $code instead of $2"; FAILED=1; fi
}

echo "Smoke test on $BASE"
check "server health" 200 "$BASE/api/health"
check "homepage (built interface)" 200 "$BASE/"
check "site page (React Router)" 200 "$BASE/about"
check "unknown address" 404 "$BASE/nope"
check "CMS (interface)" 200 "$BASE/cms"
check "CMS API without session" 401 "$BASE/api/cms/pages"
check "image upload without session" 401 "$BASE/api/cms/media"
check "public content (default texts without database)" 200 "$BASE/api/pages/home"
check "mock-up photo" 200 "$BASE/images/meagan-hero.jpg"
check "sign-in state (public)" 200 "$BASE/api/auth/session"
check "sitemap" 200 "$BASE/sitemap.xml"
check "robots.txt" 200 "$BASE/robots.txt"

if ! curl -s "$BASE/contact" | grep -q '<title>Contact · Real Reel Drama'; then
  echo "  FAIL SEO tags missing from /contact"; FAILED=1
else
  echo "  ok   page SEO tags"
fi

if ! curl -sI "$BASE/" | grep -qi '^content-security-policy'; then
  echo "  FAIL security headers missing"; FAILED=1
else
  echo "  ok   security headers"
fi

if [ "$FAILED" != 0 ]; then
  echo "--- server log ---"; cat smoke-server.log
  exit 1
fi
echo "All good."
