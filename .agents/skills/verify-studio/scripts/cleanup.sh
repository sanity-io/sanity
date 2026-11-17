#!/usr/bin/env bash
# Usage: cleanup.sh
#
# Undoes what start-studio.sh, auth-gateway.sh and login.sh did, and nothing
# else: closes the skill's browser session, stops the process trees of the
# tmux sessions it created plus the listener PIDs it recorded (pnpm can leave
# `sanity dev` running after its own process exits), deletes the gateway's
# token file and, for the e2e target, deletes the cursor_ci_<hex> dataset it
# created. Servers it did not start keep running, even on the same ports.
# Safe to run more than once.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

if [[ ! -f "$STATE_FILE" ]]; then
  rm -f "$STATE_DIR/gateway-token"
  log "nothing to clean up ($STATE_FILE does not exist)"
  exit 0
fi

if [[ -n "$(state_get BROWSER_SESSION)" ]]; then
  "$SKILL_DIR/scripts/pw.sh" close >/dev/null 2>&1 || true
  log "closed browser session $(state_get BROWSER_SESSION)"
fi

declare -A seen=()
targets=()
add_tree() {
  local pid
  while read -r pid; do
    [[ -n "$pid" && "$pid" != "$$" && -z "${seen[$pid]:-}" ]] || continue
    seen[$pid]=1
    targets+=("$pid")
  done < <(process_tree "$1")
}

sessions="$(state_get SESSIONS)"
for session in $sessions; do
  tmux_cmd has-session -t "=$session" 2>/dev/null || continue
  while read -r pane_pid; do
    [[ -n "$pane_pid" ]] && add_tree "$pane_pid"
  done < <(tmux_cmd list-panes -s -t "=$session" -F '#{pane_pid}')
done
for pid in $(state_get PIDS); do
  kill -0 "$pid" 2>/dev/null && add_tree "$pid"
done

if ((${#targets[@]})); then
  kill -TERM "${targets[@]}" 2>/dev/null || true
  for _ in $(seq 1 20); do
    alive=()
    for pid in "${targets[@]}"; do kill -0 "$pid" 2>/dev/null && alive+=("$pid"); done
    ((${#alive[@]})) || break
    sleep 0.5
  done
  if ((${#alive[@]})); then
    kill -KILL "${alive[@]}" 2>/dev/null || true
  fi
  log "stopped ${#targets[@]} process(es) this skill started"
fi
for session in $sessions; do
  tmux_cmd kill-session -t "=$session" 2>/dev/null || true
done

for port in $(state_get PORTS) "$GATEWAY_PORT"; do
  if port_in_use "$port"; then
    log "warning: :$port is still in use by PID(s) $(listener_pids "$port" | tr '\n' ' ')- not started by this run, left alone"
  fi
done

dataset="$(state_get DATASET)"
if [[ -n "$dataset" ]]; then
  if [[ "$(state_get DATASET_OWNED)" == 1 && "$dataset" =~ ^cursor_ci_[0-9a-f]+$ ]]; then
    target_config e2e
    require_token
    status="$(printf 'Authorization: Bearer %s\n' "$(target_token)" |
      curl -sS -o /dev/null -w '%{http_code}' -X DELETE -H @- --max-time 30 \
        "https://$TARGET_PROJECT_ID.$TARGET_API_HOST/v2023-02-03/datasets/$dataset" || true)"
    case "$status" in
      200 | 404) log "deleted dataset $dataset" ;;
      *) die "deleting dataset $dataset returned HTTP $status; retry cleanup.sh (pnpm e2e:cleanup sweeps cursor_ci_* datasets older than 24h as a backstop)" ;;
    esac
  else
    log "left dataset $dataset in place (it was passed in through VERIFY_STUDIO_DATASET)"
  fi
fi

rm -f "$STATE_DIR/gateway-token" "$STATE_FILE"
log "done; logs are kept in $STATE_DIR"
