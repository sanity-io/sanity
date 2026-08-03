#!/usr/bin/env bash
# Serve a SNAPSHOT of the static build, never the build directory itself.
#
# `npm run build` clears and rewrites `storybook-static/` in place, so an http-server pointed at
# that directory serves a half-written tree mid-build and looks "stuck". This has bitten twice.
#
# Copying to `storybook-served/` first decouples the two: builds touch `storybook-static/`, the
# server only ever reads `storybook-served/`, and a rebuild becomes visible when you re-run this
# rather than halfway through compilation.
set -euo pipefail
PORT="${1:-6070}"
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$HERE/storybook-static/index.json" ]; then
  echo "no completed build in storybook-static/ — run 'npm run build' first" >&2
  exit 1
fi

rm -rf "$HERE/storybook-served"
cp -R "$HERE/storybook-static" "$HERE/storybook-served"

lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
sleep 1
npx --yes http-server "$HERE/storybook-served" -p "$PORT" --silent
