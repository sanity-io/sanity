#!/usr/bin/env -S pnpm tsx
// oxlint-disable no-console
import {execFile, execFileSync} from 'node:child_process'
import {X509Certificate} from 'node:crypto'
import {mkdir, readFile} from 'node:fs/promises'
import * as tls from 'node:tls'
import {fileURLToPath} from 'node:url'
import {parseArgs, promisify} from 'node:util'

import {getCertificate} from '@vitejs/plugin-basic-ssl'
import {map, pipe, takeUntil, tap, timer} from 'rxjs'

import {createConnectionFlapper} from './connectivity'
import {createDebugProxy, type ProxyHandler} from './createDebugProxy'
import {withLatency} from './latency'
import {createRequestProxy, createSSEProxy} from './proxy'
import {intermittentServiceErrors} from './requestScenarios'
import {isGetOrgIdEndpoint, isListenEndpoint} from './routes'
import {
  dropMutations,
  duplicateMutations,
  expiredToken,
  randomLatency,
  sendReset,
  shuffleEventDelivery,
} from './scenarios'

const HELP = `A local debugging proxy for the Sanity API

Usage: debug-proxy [options]

Options:
  --port <port>               HTTP/2 (TLS) listener port (default: 3051)
  --force-http1               don't offer h2 in the TLS handshake, forcing
                              clients down to HTTP/1.1 over TLS — useful for
                              testing legacy-protocol handling
  --http1                     also serve a plain (cleartext) HTTP/1.1 listener
  --http1-port <port>         port for the plain listener (default: 3050)
  --api-host <host>           upstream Sanity API host (default: api.sanity.io;
                              use api.sanity.work for staging)
  --listener-ttl <seconds>    disconnect SSE listeners after this many seconds
                              to simulate flaky connections (default: never)
  --flap <on>[:<off>]         simulate flapping connectivity: proxy normally
                              for <on> seconds, then go "offline" for <off>
                              seconds (new requests reset, live streams cut),
                              repeating. A single number means equal phases,
                              e.g. --flap 30:15 or --flap 20
  --latency <ms>[:<maxMs>]    delay each request by this many milliseconds
                              before forwarding it upstream; a range applies
                              random jitter per request, e.g. --latency 800
                              or --latency 200:1500
  --error-probability <0..1>  simulate an incident: each request independently
                              fails with a random 5xx (500/502/503/504) instead
                              of being forwarded upstream, at this probability
                              (default: 0)
  --sse-faults                apply the SSE fault scenarios (shuffle, duplicate,
                              latency, reset, drop) to the listener endpoint
  --drop-probability <0..1>   probability a mutation event is dropped
                              (requires --sse-faults; default: 0)
  --reset-probability <0..1>  probability a reset is sent instead of a mutation
                              (requires --sse-faults; default: 0)
  --org-401                   make the get-org-id endpoint return 401
  --expire-token <seconds>    after <seconds>, answer every API request with the
                              API's expired-session 401 (without forwarding
                              upstream), simulating a token that expires
                              mid-session. Use 0 to expire immediately, e.g.
                              --expire-token 30 or --expire-token 0
  -h, --help                  show this help

Environment:
  SANITY_TOKEN  Sanity API token, injected as "Authorization: Bearer <token>"
                on proxied requests. Kept out of argv since it's a secret —
                set it in the shell or in a .env file next to this package.
`

function parseFlags() {
  try {
    return parseArgs({
      // Flags forwarded through script runners
      args: process.argv.slice(2).filter((arg) => arg !== '--'),
      options: {
        'port': {type: 'string', default: '3051'},
        'force-http1': {type: 'boolean', default: false},
        'http1': {type: 'boolean', default: false},
        'http1-port': {type: 'string', default: '3050'},
        'api-host': {type: 'string', default: 'api.sanity.io'},
        'listener-ttl': {type: 'string', default: '0'},
        'flap': {type: 'string'},
        'latency': {type: 'string'},
        'error-probability': {type: 'string', default: '0'},
        'sse-faults': {type: 'boolean', default: false},
        'drop-probability': {type: 'string', default: '0'},
        'reset-probability': {type: 'string', default: '0'},
        'org-401': {type: 'boolean', default: false},
        'expire-token': {type: 'string'},
        'help': {type: 'boolean', short: 'h', default: false},
      },
    }).values
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    console.error('Run with --help for usage')
    return process.exit(1)
  }
}

const flags = parseFlags()

if (flags.help) {
  console.info(HELP)
  process.exit(0)
}

/** Parse a flag as a non-negative integer, exiting with a clear error if not. */
function intFlag(name: string, value: string): number {
  if (!/^\d+$/.test(value)) {
    console.error(`Invalid --${name}: expected a non-negative integer, got "${value}"`)
    process.exit(1)
  }
  return Number(value)
}

/** Parse the --flap value (`<on>[:<off>]` in seconds) into phase durations. */
function flapFlag(value: string): {onlineMs: number; offlineMs: number} {
  const [on, off = on, ...rest] = value.split(':')
  const onlineSec = Number(on)
  const offlineSec = Number(off)
  if (
    rest.length > 0 ||
    !Number.isFinite(onlineSec) ||
    !Number.isFinite(offlineSec) ||
    onlineSec <= 0 ||
    offlineSec <= 0
  ) {
    console.error(
      `Invalid --flap: expected "<onlineSeconds>:<offlineSeconds>" (or a single number for equal phases), got "${value}"`,
    )
    process.exit(1)
  }
  return {onlineMs: onlineSec * 1000, offlineMs: offlineSec * 1000}
}

/** Parse the --latency value (`<ms>[:<maxMs>]`) into a delay range. */
function latencyFlag(value: string): {minMs: number; maxMs: number} {
  const [min, max = min, ...rest] = value.split(':')
  const minMs = Number(min)
  const maxMs = Number(max)
  if (
    rest.length > 0 ||
    !Number.isInteger(minMs) ||
    !Number.isInteger(maxMs) ||
    minMs < 0 ||
    maxMs < minMs
  ) {
    console.error(
      `Invalid --latency: expected "<ms>" or "<minMs>:<maxMs>" (non-negative, max >= min), got "${value}"`,
    )
    process.exit(1)
  }
  return {minMs, maxMs}
}

/** Parse a flag as a probability in [0, 1], exiting with a clear error if not. */
function probabilityFlag(name: string, value: string): number {
  const parsed = value.trim() === '' ? NaN : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    console.error(`Invalid --${name}: expected a number between 0 and 1, got "${value}"`)
    process.exit(1)
  }
  return parsed
}

const TLS_PORT = intFlag('port', flags.port)
const FORCE_HTTP1 = flags['force-http1']
const ENABLE_HTTP1 = flags.http1
const HTTP1_PORT = intFlag('http1-port', flags['http1-port'])
const API_HOST = flags['api-host']
const LISTENER_TTL_MS = intFlag('listener-ttl', flags['listener-ttl']) * 1000
const FLAP = flags.flap === undefined ? undefined : flapFlag(flags.flap)
const LATENCY = flags.latency === undefined ? undefined : latencyFlag(flags.latency)
const ERROR_PROBABILITY = probabilityFlag('error-probability', flags['error-probability'])
const ENABLE_SSE_FAULTS = flags['sse-faults']
const DROPPED_MUTATION_PROBABILITY = probabilityFlag('drop-probability', flags['drop-probability'])
const RESET_PROBABILITY = probabilityFlag('reset-probability', flags['reset-probability'])
const FORCE_ORG_401 = flags['org-401']
const EXPIRE_TOKEN_AFTER_MS =
  flags['expire-token'] === undefined
    ? undefined
    : intFlag('expire-token', flags['expire-token']) * 1000
const SANITY_TOKEN = process.env.SANITY_TOKEN

if (!SANITY_TOKEN) {
  console.warn(
    `SANITY_TOKEN environment variable missing. If you are using Cookie-based auth, you will only be able to read from public datasets.`,
  )
}

// --- TLS certificates -------------------------------------------------------
//
// The proxy is addressed by arbitrary `<projectId>.localhost` hostnames, and
// browsers reject `*.localhost` wildcard certs (RFC 6125 requires two labels
// under a wildcard) — so no single static certificate can cover them all.
// Instead, certificates are minted on demand per hostname via the TLS SNI
// callback and cached in .certs/sni/:
//
//   - with mkcert installed (`brew install mkcert && mkcert -install`), the
//     minted certs are signed by its locally-trusted CA → no browser warnings
//   - without mkcert, they're self-signed → accept the browser interstitial
//     once per host (or install mkcert and restart)

const CERTS_DIR = new URL('../.certs/', import.meta.url)
const SNI_CERTS_DIR = new URL('./sni/', CERTS_DIR)
const VALID_SNI_HOSTNAME = /^[a-z0-9.-]+$/i

const execFileAsync = promisify(execFile)

function detectMkcert(): boolean {
  try {
    execFileSync('mkcert', ['-CAROOT'], {stdio: 'ignore'})
    return true
  } catch {
    return false
  }
}
const MKCERT_AVAILABLE = detectMkcert()

/**
 * Mint (or read from the disk cache) a certificate for the given hostname —
 * mkcert-signed when available, self-signed otherwise.
 */
async function mintCert(hostname: string): Promise<{key: string; cert: string}> {
  const certPath = new URL(`./${hostname}.pem`, SNI_CERTS_DIR)
  const keyPath = new URL(`./${hostname}-key.pem`, SNI_CERTS_DIR)
  if (MKCERT_AVAILABLE) {
    try {
      const [key, cert] = await Promise.all([readFile(keyPath, 'utf8'), readFile(certPath, 'utf8')])
      return {key, cert}
    } catch {
      await mkdir(SNI_CERTS_DIR, {recursive: true})
      await execFileAsync('mkcert', [
        '-cert-file',
        fileURLToPath(certPath),
        '-key-file',
        fileURLToPath(keyPath),
        hostname,
      ])
      console.info(`Minted TLS certificate for ${hostname}`)
      const [key, cert] = await Promise.all([readFile(keyPath, 'utf8'), readFile(certPath, 'utf8')])
      return {key, cert}
    }
  }
  // Self-signed fallback (getCertificate caches per directory)
  const pem = await getCertificate(
    fileURLToPath(new URL(`./self-signed/${hostname}/`, SNI_CERTS_DIR)),
    'debug-proxy',
    [hostname],
  )
  return {key: pem, cert: pem}
}

/**
 * Read a user-provided key.pem/cert.pem pair from .certs/, if present. It is
 * preferred for any hostname it covers; other hostnames are minted on demand.
 */
async function loadUserCert(): Promise<{key: string; cert: string} | undefined> {
  try {
    const [key, cert] = await Promise.all([
      readFile(new URL('key.pem', CERTS_DIR), 'utf8'),
      readFile(new URL('cert.pem', CERTS_DIR), 'utf8'),
    ])
    console.info('Using TLS certificate from .certs/cert.pem')
    return {key, cert}
  } catch {
    return undefined
  }
}

async function loadTlsConfig(): Promise<{
  key: string
  cert: string
  SNICallback: (
    servername: string,
    cb: (err: Error | null, ctx?: tls.SecureContext) => void,
  ) => void
}> {
  const userCert = await loadUserCert()
  const defaultCert = userCert ?? (await mintCert('localhost'))

  if (!MKCERT_AVAILABLE && !userCert) {
    console.warn(
      [
        '',
        'mkcert not found — serving self-signed TLS certificates, which browsers',
        'reject with ERR_CERT_AUTHORITY_INVALID. Either:',
        '',
        '  a) install mkcert for trusted certificates (one-time, recommended):',
        '     brew install mkcert && mkcert -install',
        '     …then restart the proxy',
        '',
        '  b) or accept the certificate once per project host: open e.g.',
        `     https://<projectId>.localhost:${TLS_PORT}/v1/ping`,
        '     in the browser and click "Advanced" → "Proceed", then reload the studio',
        '',
      ].join('\n'),
    )
  }

  const contexts = new Map<string, Promise<tls.SecureContext>>()
  const getContext = (servername: string): Promise<tls.SecureContext> => {
    let context = contexts.get(servername)
    if (!context) {
      context = (async () => {
        if (userCert && new X509Certificate(userCert.cert).checkHost(servername)) {
          return tls.createSecureContext(userCert)
        }
        return tls.createSecureContext(await mintCert(servername))
      })()
      contexts.set(servername, context)
    }
    return context
  }

  return {
    ...defaultCert,
    SNICallback: (servername, cb) => {
      const hostname = servername.toLowerCase()
      if (!VALID_SNI_HOSTNAME.test(hostname)) {
        cb(new Error(`Invalid SNI hostname: ${servername}`))
        return
      }
      getContext(hostname).then(
        (context) => cb(null, context),
        (error) => cb(error instanceof Error ? error : new Error(String(error))),
      )
    },
  }
}

const listenEndpointProxy = createSSEProxy((events$) =>
  events$.pipe(
    ENABLE_SSE_FAULTS
      ? pipe(
          shuffleEventDelivery(3_000),
          duplicateMutations(0.2),
          randomLatency(100, 2_000),
          sendReset(RESET_PROBABILITY),
          dropMutations(DROPPED_MUTATION_PROBABILITY),
        )
      : tap(),
    LISTENER_TTL_MS ? takeUntil(timer(LISTENER_TTL_MS)) : tap(),
  ),
)

const orgEndpointProxy = createRequestProxy({
  transformHeaders: (headers$) =>
    headers$.pipe(
      map((headers) => {
        if (headers.req.method === 'OPTIONS') {
          return headers
        }
        return {
          ...headers,
          statusCode: 401,
        }
      }),
    ),
})

// Render a live, in-place countdown to the next flap transition. On a TTY the
// line rewrites itself each second via carriage return; otherwise (piped, e.g.
// under run-p) we skip the ticking and just log the transition once, since
// carriage returns would render as noise.
const isTty = process.stdout.isTTY
let countdownTimer: ReturnType<typeof setInterval> | undefined

function startCountdown(online: boolean, phaseMs: number) {
  clearInterval(countdownTimer)
  const label = online ? 'online' : 'offline'
  const deadline = Date.now() + phaseMs

  if (!isTty) {
    console.info(`[debug-proxy] network ${label} for the next ${Math.round(phaseMs / 1000)}s`)
    return
  }

  const render = () => {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    // \r returns to the line start; padding clears any longer previous line
    process.stdout.write(`\r[debug-proxy] network ${label} — next change in ${remaining}s   `)
    if (remaining <= 0) {
      clearInterval(countdownTimer)
    }
  }
  render()
  countdownTimer = setInterval(render, 1000)
  countdownTimer.unref?.()
}

// One flapper shared across all routes and both listeners — every request
// rides the same simulated network.
const flapper = FLAP
  ? createConnectionFlapper({
      ...FLAP,
      onTransition: (online) => {
        if (isTty) {
          process.stdout.write('\n')
        }
        startCountdown(online, online ? FLAP.onlineMs : FLAP.offlineMs)
      },
    })
  : undefined

// --error-probability sits between the (optional) latency delay and the handler
// so a faulted request returns its 5xx immediately rather than after the delay.
const faultRequests = intermittentServiceErrors(ERROR_PROBABILITY)

// Session-expiry deadline: requests after this wall-clock time get the 401.
// Armed at startup; a 0s delay means "already past", i.e. expire now. Re-armed
// whenever the studio re-authenticates (a `/auth/fetch` token exchange), so you
// can log back in and watch the simulated session lapse again — see below.
let sessionExpiresAt =
  EXPIRE_TOKEN_AFTER_MS === undefined ? undefined : Date.now() + EXPIRE_TOKEN_AFTER_MS
const isSessionExpired = () => sessionExpiresAt !== undefined && Date.now() >= sessionExpiresAt
const rearmSessionExpiry = () => {
  if (EXPIRE_TOKEN_AFTER_MS !== undefined) {
    sessionExpiresAt = Date.now() + EXPIRE_TOKEN_AFTER_MS
  }
}

// Network-level scenarios applied to every handler: --expire-token replaces the
// response with the API's expired-session 401 once the deadline passes,
// --error-probability faults requests with a random 5xx, --latency delays each
// request, --flap sits outside it so offline resets stay immediate.
const withNetworkScenarios = (handler: ProxyHandler): ProxyHandler => {
  // An expired session would fail at the API for any request, so this wraps the
  // real handler rather than being scoped to a route.
  const maybeExpired =
    EXPIRE_TOKEN_AFTER_MS === undefined
      ? handler
      : expiredToken(handler, isSessionExpired, {onReauthenticated: rearmSessionExpiry})
  const faulted = faultRequests(maybeExpired)
  const delayed = LATENCY ? withLatency(faulted, LATENCY) : faulted
  return flapper ? flapper.wrap(delayed) : delayed
}

const routes = [
  ...(FORCE_ORG_401
    ? [{match: isGetOrgIdEndpoint(), handler: withNetworkScenarios(orgEndpointProxy)}]
    : []),
  // Only intercept the listener endpoint when a scenario needs it — with no
  // scenarios active, even SSE flows through the byte-transparent default
  // handler (which is still subject to --flap and --latency)
  ...(ENABLE_SSE_FAULTS || LISTENER_TTL_MS > 0
    ? [{match: isListenEndpoint(), handler: withNetworkScenarios(listenEndpointProxy)}]
    : []),
]

const sharedConfig = {
  apiHost: API_HOST,
  token: SANITY_TOKEN,
  routes,
  defaultHandler: withNetworkScenarios(createRequestProxy()),
}

const tlsProxy = createDebugProxy({
  ...sharedConfig,
  port: TLS_PORT,
  tls: await loadTlsConfig(),
  forceHttp1: FORCE_HTTP1,
})

await tlsProxy.listen()
console.info(
  FORCE_HTTP1
    ? `HTTP/1.1-over-TLS proxy (h2 disabled) listening on https://localhost:${TLS_PORT}`
    : `HTTP/2 (+ HTTP/1.1 fallback) proxy listening on https://localhost:${TLS_PORT}`,
)

if (ENABLE_HTTP1) {
  const http1Proxy = createDebugProxy({...sharedConfig, port: HTTP1_PORT})
  await http1Proxy.listen()
  console.info(`HTTP/1.1 (cleartext) proxy listening on http://localhost:${HTTP1_PORT}`)
}

if (FLAP) {
  console.info(
    `Flapping connectivity: ${FLAP.onlineMs / 1000}s online → ${FLAP.offlineMs / 1000}s offline, repeating`,
  )
  // Start the countdown for the initial (online) phase now that the startup
  // banner has printed, so the in-place countdown line stays at the bottom.
  startCountdown(true, FLAP.onlineMs)
}

if (LATENCY) {
  console.info(
    LATENCY.minMs === LATENCY.maxMs
      ? `Latency: ${LATENCY.minMs}ms per request`
      : `Latency: ${LATENCY.minMs}–${LATENCY.maxMs}ms per request (random jitter)`,
  )
}

if (ERROR_PROBABILITY > 0) {
  console.info(
    `Simulated incident: ${Math.round(ERROR_PROBABILITY * 100)}% of requests fail with a random 5xx (500/502/503/504)`,
  )
}

if (EXPIRE_TOKEN_AFTER_MS !== undefined) {
  console.info(
    EXPIRE_TOKEN_AFTER_MS === 0
      ? 'Session expiry: every API request returns the expired-session 401'
      : `Session expiry: API requests return the expired-session 401 after ${EXPIRE_TOKEN_AFTER_MS / 1000}s`,
  )
}
