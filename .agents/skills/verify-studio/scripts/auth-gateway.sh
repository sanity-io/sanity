#!/usr/bin/env bash
# Usage: auth-gateway.sh <test|e2e>
#
# Serves a one-page login gateway on http://127.0.0.1:$VERIFY_STUDIO_GATEWAY_PORT
# (default 3390). Opening it forwards the browser into the studio with the
# target's token in the `#token=` hash, which Studio's auth store consumes on
# boot and then strips from the address bar. `/?path=/test/structure/author`
# forwards to that studio path instead of the workspace root.
#
# The token never appears in a URL you type, a command line, a log line or a
# prompt: it is copied from the environment into a 0600 file in the state
# directory, read by the gateway process, and only rendered into the page the
# browser receives. The page waits a second before forwarding, so the command
# that opened it reports the gateway URL rather than the tokenized one.
# cleanup.sh deletes the file and stops the gateway.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

if [[ "${1:-}" == --serve ]]; then
  exec node --input-type=module - <<'JS'
import {readFileSync} from 'node:fs'
import {createServer} from 'node:http'

const {GATEWAY_PORT, GATEWAY_ORIGIN, GATEWAY_BASE_PATH, GATEWAY_TOKEN_FILE, GATEWAY_DELAY_MS} =
  process.env
const token = readFileSync(GATEWAY_TOKEN_FILE, 'utf8').trim()

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  if (url.pathname !== '/') {
    res.writeHead(404).end()
    return
  }
  const path = url.searchParams.get('path') || GATEWAY_BASE_PATH
  if (!path.startsWith('/') || path.startsWith('//')) {
    res.writeHead(400, {'content-type': 'text/plain'}).end('path must be a studio path')
    return
  }
  const target = new URL(path, GATEWAY_ORIGIN)
  target.hash = `token=${encodeURIComponent(token)}`
  const href = JSON.stringify(target.href).replaceAll('<', '\\u003c')
  res.writeHead(200, {
    'cache-control': 'no-store',
    'content-type': 'text/html; charset=utf-8',
    'referrer-policy': 'no-referrer',
  })
  res.end(
    `<!doctype html><meta charset="utf-8"><title>verify-studio login</title>` +
      `<p>Signing in to ${target.origin}${target.pathname}…</p>` +
      `<script>setTimeout(() => location.replace(${href}), ${Number(GATEWAY_DELAY_MS) || 0})</script>`,
  )
  console.log(`${new Date().toISOString()} forwarded to ${target.origin}${target.pathname}`)
}).listen(Number(GATEWAY_PORT), '127.0.0.1', () => {
  console.log(`auth gateway on http://127.0.0.1:${GATEWAY_PORT}/ -> ${GATEWAY_ORIGIN}${GATEWAY_BASE_PATH}`)
})
JS
fi

target_config "${1:?usage: auth-gateway.sh <test|e2e>}"
require_token

session=verify-studio-gateway
if tmux_cmd has-session -t "=$session" 2>/dev/null; then
  [[ "$(state_get GATEWAY_TARGET)" == "$TARGET_NAME" ]] ||
    die "the gateway is already running for '$(state_get GATEWAY_TARGET)'. Run cleanup.sh to switch targets."
  log "gateway already running: http://127.0.0.1:$GATEWAY_PORT/"
  exit 0
fi
port_in_use "$GATEWAY_PORT" &&
  die "port $GATEWAY_PORT is in use. Set VERIFY_STUDIO_GATEWAY_PORT to a free port."

mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"
token_file="$STATE_DIR/gateway-token"
(
  umask 077
  target_token >"$token_file"
)

gateway_log="$STATE_DIR/gateway.log"
tmux_cmd new-session -d -s "$session" -c "$STATE_DIR" \
  -e "PATH=$PATH" \
  -e "GATEWAY_PORT=$GATEWAY_PORT" \
  -e "GATEWAY_ORIGIN=http://localhost:$TARGET_PORT" \
  -e "GATEWAY_BASE_PATH=$TARGET_BASE_PATH" \
  -e "GATEWAY_TOKEN_FILE=$token_file" \
  -e "GATEWAY_DELAY_MS=${VERIFY_STUDIO_GATEWAY_DELAY_MS:-1000}" \
  "bash $(printf %q "$SKILL_DIR/scripts/auth-gateway.sh") --serve 2>&1 | tee -a $(printf %q "$gateway_log")"
state_append SESSIONS "$session"
state_set GATEWAY_TARGET "$TARGET_NAME"

for _ in $(seq 1 25); do
  if [[ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$GATEWAY_PORT/" || true)" == 200 ]]; then
    state_append PIDS "$(listener_pids "$GATEWAY_PORT" | tr '\n' ' ')"
    log "gateway ready: http://127.0.0.1:$GATEWAY_PORT/ -> http://localhost:$TARGET_PORT$TARGET_BASE_PATH"
    exit 0
  fi
  sleep 0.2
done
cat "$gateway_log" >&2 || true
die "the gateway did not start"
