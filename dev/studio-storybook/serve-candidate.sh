#!/usr/bin/env bash
# Serve the CANDIDATE snapshot on :6071, beside the reference on :6070.
#
# The review loop this exists for:
#
#   :6070  reference  <- storybook-served/   the catalog as last signed off. Never moves
#                                            under a review in progress.
#   :6071  candidate  <- storybook-candidate/ the same catalog carrying the current batch
#                                            of story fixes. Audit on 6070, sign off on 6071.
#
# Why two snapshots and not one server plus a rebuild: `npm run build` takes 15 to 20 minutes
# and rewrites storybook-static/ in place, so there is no live view of a change. Splitting the
# reference from the candidate means a rebuild never disturbs the thing being reviewed, and the
# before and after can sit in two tabs at the same story.
#
# The dev server (:6060) is not an option: Vite cannot transform the Studio source tree on
# demand and never delivers an iframe.html. Static builds are the only path.
#
# Usage:
#   npm run build && ./serve-candidate.sh          # publish the new build as the candidate
#   ./serve-candidate.sh --promote                 # candidate signed off: make it the reference
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PORT=6071

if [ "${1:-}" = "--promote" ]; then
  if [ ! -f "$HERE/storybook-candidate/index.json" ]; then
    echo "no candidate to promote: run 'npm run build && ./serve-candidate.sh' first" >&2
    exit 1
  fi
  rm -rf "$HERE/storybook-served"
  cp -R "$HERE/storybook-candidate" "$HERE/storybook-served"
  echo "promoted: storybook-candidate/ is now the reference in storybook-served/"
  echo "restart the reference server to publish it:  ./serve-static.sh 6070"
  exit 0
fi

if [ ! -f "$HERE/storybook-static/index.json" ]; then
  echo "no completed build in storybook-static/: run 'npm run build' first" >&2
  exit 1
fi

# Refuse to publish a candidate identical to the reference: that means the build did not run,
# and two servers showing the same tree is worse than one, because it looks like a verified
# no-change when nothing was actually compared.
if [ -f "$HERE/storybook-served/index.json" ]; then
  if diff -q "$HERE/storybook-served/index.json" "$HERE/storybook-static/index.json" >/dev/null 2>&1; then
    echo "storybook-static/ is identical to the reference: did 'npm run build' actually run?" >&2
    echo "pass --force to publish it anyway" >&2
    [ "${1:-}" = "--force" ] || exit 1
  fi
fi

rm -rf "$HERE/storybook-candidate"
cp -R "$HERE/storybook-static" "$HERE/storybook-candidate"

REF=$(node -e "console.log(Object.keys(require('$HERE/storybook-served/index.json').entries).length)" 2>/dev/null || echo '?')
CAN=$(node -e "console.log(Object.keys(require('$HERE/storybook-candidate/index.json').entries).length)")
echo "reference :6070 = $REF entries   candidate :6071 = $CAN entries"

lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
sleep 1
npx --yes http-server "$HERE/storybook-candidate" -p "$PORT" --silent
