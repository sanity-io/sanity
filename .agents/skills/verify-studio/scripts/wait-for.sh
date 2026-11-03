#!/usr/bin/env bash
# Usage: wait-for.sh <css selector> [text]
#
# playwright-cli fails a click or fill straight away when its target is not in
# the page yet, and Studio renders most panes, dialogs and menus asynchronously.
# Polls until a visible element matches the selector (and, when given, contains
# the text), so the next pw.sh command has something to act on. Times out after
# VERIFY_STUDIO_WAIT_TIMEOUT seconds (default 60).
set -euo pipefail
source "$(dirname "$0")/lib.sh"

selector="${1:?usage: wait-for.sh <css selector> [text]}"
text="${2:-}"
pw="$SKILL_DIR/scripts/pw.sh"

args_json="$(node -e 'process.stdout.write(JSON.stringify(process.argv.slice(1)))' "$selector" "$text")"
probe="(([selector, text]) => [...document.querySelectorAll(selector)].some((el) =>
  el.checkVisibility() && (!text || el.innerText.includes(text))))($args_json)"

timeout="${VERIFY_STUDIO_WAIT_TIMEOUT:-60}"
deadline=$((SECONDS + timeout))
while ((SECONDS < deadline)); do
  [[ "$("$pw" --raw eval "$probe" 2>/dev/null || true)" == true ]] && exit 0
  sleep 1
done
suffix="${text:+ containing \"$text\"}"
die "no visible $selector$suffix after ${timeout}s"
