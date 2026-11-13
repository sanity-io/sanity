#!/usr/bin/env bash
# Usage: start-studio.sh <test|e2e>
#
# test  dev/test-studio on :3333 (plus dev/preview-iframe on :3334), workspace
#       /test, production project ppsg7ml5, token $STUDIO_AUTH_TOKEN.
# e2e   dev/studio-e2e-testing on :3339, workspace /chromium, staging project
#       ittbm412, token $STUDIO_E2E_AUTH_TOKEN, and a fresh cursor_ci_<hex>
#       dataset for this run (VERIFY_STUDIO_DATASET reuses an existing one,
#       which cleanup.sh then leaves alone).
#
# Starts the studio in its own tmux session and records the sessions, PIDs and
# dataset in the state file, so cleanup.sh can stop exactly what this started.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

target_config "${1:?usage: start-studio.sh <test|e2e>}"

[[ ! -f "$STATE_FILE" ]] ||
  die "a previous run left $STATE_FILE behind. Run cleanup.sh first, it stops that run's processes and deletes its dataset."

[[ -f "$REPO_ROOT/packages/sanity/lib/cli.js" ]] ||
  die "packages are not built: sanity dev loads sanity.cli.ts through packages/sanity/lib/cli.js. Build first (see AGENTS.md > Cursor Cloud specific instructions)."

for port in "$TARGET_PORT" $TARGET_EXTRA_PORTS; do
  if port_in_use "$port"; then
    die "port $port is already in use by PID(s) $(listener_pids "$port" | tr '\n' ' ')- stop that server first, this skill only manages servers it started itself."
  fi
done

"$SKILL_DIR/scripts/check-auth.sh" "$TARGET_NAME"

mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"
state_set TARGET "$TARGET_NAME"
state_set PORTS "$TARGET_PORT${TARGET_EXTRA_PORTS:+ $TARGET_EXTRA_PORTS}"

tmux_env=(-e "PATH=$PATH")
if [[ "$TARGET_NAME" == e2e ]]; then
  if [[ -n "${VERIFY_STUDIO_DATASET:-}" ]]; then
    TARGET_DATASET="$VERIFY_STUDIO_DATASET"
    state_set DATASET_OWNED 0
  else
    TARGET_DATASET="cursor_ci_$(openssl rand -hex 3)"
    state_set DATASET_OWNED 1
  fi
  state_set DATASET "$TARGET_DATASET"
  log "creating dataset $TARGET_DATASET on $TARGET_PROJECT_ID (pnpm e2e:setup retries 429s)"
  (
    cd "$REPO_ROOT"
    export SANITY_E2E_PROJECT_ID="$TARGET_PROJECT_ID"
    export SANITY_E2E_DATASET="$TARGET_DATASET"
    SANITY_E2E_SESSION_TOKEN="$(target_token)"
    export SANITY_E2E_SESSION_TOKEN
    pnpm --silent e2e:setup
  )
  # `sanity dev` needs no token: the browser signs in through auth-gateway.sh.
  tmux_env+=(-e "SANITY_E2E_PROJECT_ID=$TARGET_PROJECT_ID" -e "SANITY_E2E_DATASET=$TARGET_DATASET")
fi

session="verify-studio-$TARGET_NAME"
studio_log="$STATE_DIR/$TARGET_NAME.log"
: >"$studio_log"
tmux_cmd new-session -d -s "$session" -c "$REPO_ROOT" "${tmux_env[@]}" \
  "$TARGET_COMMAND 2>&1 | tee -a $(printf %q "$studio_log")"
state_append SESSIONS "$session"
log "started '$TARGET_COMMAND' in tmux session $session (log: $studio_log)"

url="http://localhost:$TARGET_PORT$TARGET_BASE_PATH"
timeout="${VERIFY_STUDIO_READY_TIMEOUT:-240}"
deadline=$((SECONDS + timeout))
for port in "$TARGET_PORT" $TARGET_EXTRA_PORTS; do
  probe="http://localhost:$port/"
  [[ "$port" == "$TARGET_PORT" ]] && probe="$url"
  until [[ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$probe" || true)" == 200 ]]; do
    if ! tmux_cmd has-session -t "=$session" 2>/dev/null; then
      tail -n 30 "$studio_log" >&2 || true
      die "the studio process exited before $probe answered. Run cleanup.sh, fix the error above, then start again."
    fi
    if ((SECONDS > deadline)); then
      tail -n 30 "$studio_log" >&2 || true
      die "$probe did not answer with 200 within ${timeout}s. Run cleanup.sh before retrying."
    fi
    sleep 2
  done
  pids="$(listener_pids "$port" | tr '\n' ' ')"
  state_append PIDS "${pids% }"
  log "ready: $probe (listener PID(s) ${pids% })"
done

log "studio: $url  project: $TARGET_PROJECT_ID  dataset: ${TARGET_DATASET}  api: $TARGET_API_HOST"
log "next: $SKILL_DIR/scripts/login.sh $TARGET_NAME"
