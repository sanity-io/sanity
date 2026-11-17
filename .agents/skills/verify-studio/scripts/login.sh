#!/usr/bin/env bash
# Usage: login.sh <test|e2e> [studio path, e.g. /test/structure/author]
#
# Opens the skill's playwright-cli browser (system Chrome unless
# VERIFY_STUDIO_BROWSER says otherwise), sends it through auth-gateway.sh and
# waits until the studio navbar renders signed in. It only ever prints the
# origin and path of the page, so the tokenized URL stays out of the output.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

target_config "${1:?usage: login.sh <test|e2e> [studio path]}"
path="${2:-$TARGET_BASE_PATH}"
pw="$SKILL_DIR/scripts/pw.sh"

port_in_use "$TARGET_PORT" || die "nothing listens on :$TARGET_PORT. Run start-studio.sh $TARGET_NAME first."
"$SKILL_DIR/scripts/auth-gateway.sh" "$TARGET_NAME"

if ! "$pw" list 2>/dev/null | grep -q 'verify-studio'; then
  "$pw" open --browser="${VERIFY_STUDIO_BROWSER:-chrome}" about:blank >/dev/null
fi
state_set BROWSER_SESSION verify-studio
"$pw" resize "${VERIFY_STUDIO_VIEWPORT_WIDTH:-1440}" "${VERIFY_STUDIO_VIEWPORT_HEIGHT:-900}" >/dev/null

encoded_path="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$path")"
"$pw" goto "http://127.0.0.1:$GATEWAY_PORT/?path=$encoded_path" >/dev/null

probe="(() => {
  if (location.port !== '$TARGET_PORT') return 'gateway'
  if (location.hash.includes('token=')) return 'consuming-token'
  if (document.querySelector('[data-testid=\"studio-navbar\"]')) return 'signed-in'
  if (/Choose login provider|Signed out/i.test(document.body?.innerText ?? '')) return 'signed-out'
  return 'loading'
})()"

timeout="${VERIFY_STUDIO_LOGIN_TIMEOUT:-180}"
deadline=$((SECONDS + timeout))
state=
while ((SECONDS < deadline)); do
  state="$("$pw" --raw eval "$probe" 2>/dev/null | tr -d '"' || true)"
  case "$state" in
    signed-in) break ;;
    signed-out) die "the studio shows the login screen: the token was not accepted. Run check-auth.sh $TARGET_NAME." ;;
  esac
  sleep 2
done
[[ "$state" == signed-in ]] || die "not signed in after ${timeout}s (last state: ${state:-unknown}). Check $STATE_DIR/$TARGET_NAME.log."

where="$("$pw" --raw eval "location.href.includes('token=') ? 'TOKEN STILL IN URL' : location.origin + location.pathname" | tr -d '"')"
[[ "$where" != 'TOKEN STILL IN URL' ]] || die "the token is still in the address bar; do not screenshot this page"
log "signed in: $where"
