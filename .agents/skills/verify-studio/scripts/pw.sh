#!/usr/bin/env bash
# Usage: pw.sh <playwright-cli command> [args...]
#
# Runs playwright-cli in the skill's own browser session (`-s=verify-studio`),
# from the state directory so its `.playwright-cli/` snapshots never land in
# the repository. Uses a playwright-cli on PATH when there is one, otherwise a
# pinned version through `pnpm dlx`. Pass absolute paths to `--filename`.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

mkdir -p "$STATE_DIR/playwright"
cd "$STATE_DIR/playwright"
if command -v playwright-cli >/dev/null 2>&1; then
  exec playwright-cli -s=verify-studio "$@"
fi
exec pnpm --silent dlx "@playwright/cli@$PLAYWRIGHT_CLI_VERSION" -s=verify-studio "$@"
