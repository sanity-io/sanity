# shellcheck shell=bash disable=SC2034 # the variables are read by the scripts that source this
# Shared helpers for the verify-studio scripts. Source it, do not run it.
#
# Nothing in here prints a token. Tokens are read from the environment by
# variable name and only ever reach curl on stdin or the gateway through a
# 0600 file in the state directory, never an argv or a log line.

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(git -C "$SKILL_DIR" rev-parse --show-toplevel)"
STATE_DIR="${VERIFY_STUDIO_STATE_DIR:-/tmp/verify-studio}"
STATE_FILE="$STATE_DIR/state.env"
GATEWAY_PORT="${VERIFY_STUDIO_GATEWAY_PORT:-3390}"
PLAYWRIGHT_CLI_VERSION="0.1.22"

log() { printf '[verify-studio] %s\n' "$*" >&2; }
die() {
  log "error: $*"
  exit 1
}

# Every target the skill knows. `target_config <name>` sets the TARGET_* variables.
target_config() {
  case "$1" in
    test)
      TARGET_NAME='test'
      TARGET_PORT=3333
      TARGET_EXTRA_PORTS=3334 # dev/preview-iframe, for Presentation
      TARGET_BASE_PATH=/test
      TARGET_PROJECT_ID=ppsg7ml5
      TARGET_DATASET='test'
      TARGET_API_HOST=api.sanity.io
      TARGET_OTHER_API_HOST=api.sanity.work
      TARGET_TOKEN_VAR="${VERIFY_STUDIO_TOKEN_VAR:-STUDIO_AUTH_TOKEN}"
      TARGET_COMMAND="pnpm dev:test-studio"
      ;;
    e2e)
      TARGET_NAME=e2e
      TARGET_PORT=3339
      TARGET_EXTRA_PORTS=
      TARGET_BASE_PATH=/chromium
      TARGET_PROJECT_ID="${SANITY_E2E_PROJECT_ID:-ittbm412}"
      TARGET_DATASET= # set per run by start-studio.sh
      TARGET_API_HOST=api.sanity.work
      TARGET_OTHER_API_HOST=api.sanity.io
      TARGET_TOKEN_VAR="${VERIFY_STUDIO_TOKEN_VAR:-STUDIO_E2E_AUTH_TOKEN}"
      TARGET_COMMAND="pnpm --filter studio-e2e-testing dev"
      ;;
    *) die "unknown target '$1' (expected 'test' or 'e2e')" ;;
  esac
}

require_token() {
  [[ -n "${!TARGET_TOKEN_VAR:-}" ]] ||
    die "\$$TARGET_TOKEN_VAR is not set. Add it as a secret (Cursor Dashboard > Cloud Agents > Secrets) or export it, then retry."
}

# The token's value, for command substitution into shell builtins only.
target_token() {
  printf '%s' "${!TARGET_TOKEN_VAR:-}"
}

tmux_cmd() {
  if [[ -f /exec-daemon/tmux.portal.conf ]]; then
    tmux -f /exec-daemon/tmux.portal.conf "$@"
  else
    tmux "$@"
  fi
}

# PIDs listening on a TCP port, one per line; empty when there are none.
listener_pids() {
  {
    if command -v lsof >/dev/null 2>&1; then
      lsof -nP -t -iTCP:"$1" -sTCP:LISTEN 2>/dev/null
    elif command -v ss >/dev/null 2>&1; then
      ss -ltnpH "sport = :$1" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2
    fi
  } | sort -u || true
}

# lsof only sees this user's processes, so also try to connect.
port_in_use() {
  [[ -n "$(listener_pids "$1")" ]] && return 0
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && return 0
  (exec 3<>"/dev/tcp/::1/$1") 2>/dev/null
}

# A PID and every process below it, collected before anything is killed so
# children that get reparented once their parent dies are still on the list.
process_tree() {
  local root="$1" pid
  local -a queue=("$root")
  local table
  table="$(ps -eo pid=,ppid=)"
  while ((${#queue[@]})); do
    pid="${queue[0]}"
    queue=("${queue[@]:1}")
    echo "$pid"
    while read -r child; do
      [[ -n "$child" ]] && queue+=("$child")
    done < <(awk -v p="$pid" '$2 == p {print $1}' <<<"$table")
  done
}

state_set() {
  mkdir -p "$STATE_DIR"
  touch "$STATE_FILE"
  local key="$1" value="$2"
  grep -v "^$key=" "$STATE_FILE" >"$STATE_FILE.tmp" || true
  printf '%s=%q\n' "$key" "$value" >>"$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
}

state_append() {
  local key="$1" value="$2" current
  current="$(state_get "$key")"
  state_set "$key" "${current:+$current }$value"
}

state_get() {
  [[ -f "$STATE_FILE" ]] || return 0
  (
    # shellcheck disable=SC1090
    source "$STATE_FILE"
    printf '%s' "${!1:-}"
  )
}

# GET /users/me on a host with the target's token. Prints the HTTP status.
users_me_status() {
  local host="$1"
  printf 'Authorization: Bearer %s\n' "$(target_token)" |
    curl -sS -o /dev/null -w '%{http_code}' -H @- --max-time 20 \
      "https://$TARGET_PROJECT_ID.$host/v2021-06-07/users/me" || true
}
