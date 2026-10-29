#!/usr/bin/env bash
# Usage: check-auth.sh <test|e2e>
#
# Checks that the target's token is accepted by the API host that studio talks
# to. A production token sent to staging (or the other way round) fails with
# 401 "Session not found", which in the browser looks like a broken login
# rather than the wrong token, so this names the mismatch instead.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

target_config "${1:?usage: check-auth.sh <test|e2e>}"
require_token

status="$(users_me_status "$TARGET_API_HOST")"
case "$status" in
  200)
    log "\$$TARGET_TOKEN_VAR is accepted by $TARGET_PROJECT_ID.$TARGET_API_HOST"
    ;;
  401)
    other="$(users_me_status "$TARGET_OTHER_API_HOST")"
    if [[ "$other" == 200 ]]; then
      die "\$$TARGET_TOKEN_VAR is a token for $TARGET_OTHER_API_HOST, but the '$TARGET_NAME' studio talks to $TARGET_API_HOST (401 Session not found). Use the other target, or point VERIFY_STUDIO_TOKEN_VAR at a $TARGET_API_HOST token."
    fi
    die "\$$TARGET_TOKEN_VAR is rejected by $TARGET_PROJECT_ID.$TARGET_API_HOST (401 Session not found) and by $TARGET_OTHER_API_HOST. The token is expired, revoked or for another project."
    ;;
  429)
    die "$TARGET_API_HOST is rate limiting this IP (429). Wait a minute and retry."
    ;;
  000 | '')
    die "could not reach $TARGET_PROJECT_ID.$TARGET_API_HOST (network error)"
    ;;
  *)
    die "unexpected HTTP $status from $TARGET_PROJECT_ID.$TARGET_API_HOST/users/me"
    ;;
esac
