import * as http from 'node:http'
import * as http2 from 'node:http2'
import * as https from 'node:https'
import * as net from 'node:net'
import * as tls from 'node:tls'

import {type MonoTypeOperatorFunction, type Subscription} from 'rxjs'

import {
  createRequestProxy,
  createSSEProxy,
  type ProxyHeaders,
  type ProxyRequest,
  type ProxyResponse,
  type ProxyTarget,
  type SSEEvent,
  writeResponseHead,
} from './proxy'

/**
 * A request handler as produced by {@link createRequestProxy} /
 * {@link createSSEProxy}: it takes the incoming request/response pair plus the
 * resolved upstream target and pipes the response through.
 */
export type ProxyHandler = (
  req: ProxyRequest,
  res: ProxyResponse,
  target: ProxyTarget,
) => Subscription

/**
 * Decides which {@link ProxyHandler} to use for a given request. Return
 * `undefined` to fall through to the next route (or the default handler).
 */
export type RouteMatcher = (req: ProxyRequest) => boolean

export interface Route {
  /** Matches against the incoming request (typically by url/method). */
  match: RouteMatcher
  /** The handler to apply when {@link match} returns true. */
  handler: ProxyHandler
}

export interface DebugProxyConfig {
  /** Port to listen on. Defaults to 3050. */
  port?: number | undefined
  /** Upstream Sanity API host, e.g. "api.sanity.io" or "api.sanity.work". */
  apiHost?: string | undefined
  /**
   * Sanity API token. When provided, it is injected as an
   * `Authorization: Bearer <token>` header on every proxied request.
   */
  token?: string | undefined
  /**
   * TLS key + cert (PEM). When provided, the server terminates TLS and
   * negotiates HTTP/2 via ALPN (with HTTP/1.1 fallback for clients that
   * don't support it). Browsers only speak HTTP/2 over TLS, so this is
   * required for exercising clients over h2. Without it, the server is a
   * plain cleartext HTTP/1.1 listener. An optional `SNICallback` can serve
   * per-hostname certificates (the CLI uses this to mint certs on demand for
   * arbitrary `<projectId>.localhost` hosts).
   */
  tls?:
    | {
        key: string | Buffer
        cert: string | Buffer
        SNICallback?: tls.TlsOptions['SNICallback']
      }
    | undefined
  /**
   * Only meaningful together with {@link DebugProxyConfig.tls}: serve plain
   * HTTPS without offering h2 in the ALPN negotiation, forcing browsers down
   * to HTTP/1.1 over TLS. Useful for testing legacy-HTTP detection.
   */
  forceHttp1?: boolean | undefined
  /**
   * Ordered list of routes. The first route whose `match` returns true wins.
   * If none match, {@link DebugProxyConfig.defaultHandler} is used.
   */
  routes?: Route[] | undefined
  /**
   * Skip upstream TLS certificate verification. Off by default — leave it off
   * unless you're intentionally pointing at a host with an untrusted cert,
   * since the API token is attached to every upstream request.
   */
  insecureUpstream?: boolean | undefined
  /**
   * Handler used when no route matches. Defaults to a transparent
   * pass-through proxy created with {@link createRequestProxy}.
   */
  defaultHandler?: ProxyHandler | undefined
}

export interface DebugProxyServer {
  /** The underlying Node server. */
  server: http.Server | https.Server | http2.Http2SecureServer
  /** Start listening. Resolves once the server is bound to the port. */
  listen: () => Promise<DebugProxyServer>
  /** Stop the server. Resolves once closed. */
  close: () => Promise<void>
  /** The port the server is configured to listen on. */
  port: number
}

const DEFAULT_PORT = 3050
// Loopback only, always: the proxy injects the API token on every request,
// so it must never be reachable from other machines.
const BIND_HOST = '127.0.0.1'
const DEFAULT_API_HOST = 'api.sanity.io'

/** A Sanity project ID (lowercase alphanumeric). */
const PROJECT_ID_PATTERN = /^[a-z0-9]+$/

function getRequestHost(req: ProxyRequest): string | undefined {
  if ('authority' in req && req.authority) {
    return req.authority
  }
  return req.headers.host
}

/**
 * Derive the projectId from a request host. Only `<subdomain>.localhost`
 * hosts carry one (the documented contract) — IP literals and bare hosts
 * (`localhost`, `127.0.0.1:3050`) proxy to the apiHost directly. Returns
 * `{error}` when there is a subdomain but it isn't a valid project ID, since
 * it would otherwise be interpolated into the upstream URL the token is
 * sent to.
 */
function deriveProjectId(requestHost: string): {projectId?: string; error?: string} {
  const hostname = requestHost.replace(/:\d+$/, '')
  if (!hostname.endsWith('.localhost')) {
    return {}
  }
  const subdomain = hostname.slice(0, -'.localhost'.length)
  if (!PROJECT_ID_PATTERN.test(subdomain)) {
    return {error: 'Invalid project ID'}
  }
  return {projectId: subdomain}
}

/**
 * Create a configurable Sanity debugging proxy server.
 *
 * The proxy derives the upstream target from the request: the `projectId` is
 * taken from the request host subdomain (`<projectId>.localhost`), so
 * `*.localhost` must resolve to `127.0.0.1`.
 *
 * Routes are matched in order; the first match wins. Build handlers with
 * {@link createSSEProxy} / {@link createRequestProxy} and compose scenario
 * operators from the `scenarios` module.
 *
 * @example
 * ```ts
 * import {createDebugProxy, createSSEProxy, dropMutations} from "@repo/debug-proxy"
 *
 * const proxy = createDebugProxy({
 *   apiHost: "api.sanity.io",
 *   token: process.env.SANITY_TOKEN,
 *   routes: [
 *     {
 *       match: (req) => req.url?.includes("/listen") ?? false,
 *       handler: createSSEProxy(dropMutations(0.2)),
 *     },
 *   ],
 * })
 *
 * await proxy.listen()
 * ```
 */
export function createDebugProxy(config: DebugProxyConfig = {}): DebugProxyServer {
  const port = config.port ?? DEFAULT_PORT
  const apiHost = config.apiHost ?? DEFAULT_API_HOST
  const token = config.token
  const routes = config.routes ?? []
  const insecureUpstream = config.insecureUpstream ?? false
  const defaultHandler = config.defaultHandler ?? createRequestProxy()

  const listener = (req: ProxyRequest, res: ProxyResponse) => {
    const requestHost = getRequestHost(req)

    if (!req.url || !requestHost) {
      writeResponseHead(res, 400, undefined, {'content-type': 'text/plain'})
      res.end('Invalid Proxy Request')
      return
    }

    const {projectId, error} = deriveProjectId(requestHost)
    if (error) {
      writeResponseHead(res, 400, undefined, {'content-type': 'text/plain'})
      res.end(error)
      return
    }

    let url: URL
    try {
      // Concatenate instead of resolving `new URL(req.url, base)`: URL
      // resolution would treat a double-slash path (`//v2025-02-19/…`, which
      // some studio requests use) as protocol-relative and swap out the host.
      // The leading-`/` check keeps the concatenation from being able to
      // change the authority (e.g. via an `@`-prefixed request target).
      if (!req.url.startsWith('/')) {
        throw new Error('not an origin-form request target')
      }
      url = new URL(['https://', projectId ? `${projectId}.` : '', apiHost, req.url].join(''))
    } catch {
      writeResponseHead(res, 400, undefined, {'content-type': 'text/plain'})
      res.end('Invalid Proxy Request')
      return
    }

    const target: ProxyTarget = {
      url,
      headers: token ? {authorization: `Bearer ${token}`} : undefined,
      insecure: insecureUpstream,
    }

    const route = routes.find((r) => r.match(req))
    const handler = route?.handler ?? defaultHandler
    handler(req, res, target)
  }

  const server = config.tls
    ? config.forceHttp1
      ? https.createServer(config.tls, listener)
      : http2.createSecureServer({...config.tls, allowHTTP1: true}, listener)
    : http.createServer(listener)

  // Track raw TCP sockets so close() can tear down live connections (SSE
  // streams, h2 sessions, h1 keep-alive) — server.close() alone would wait
  // for them forever. 'connection' fires with the raw socket on all three
  // server types, including pre-TLS for the secure ones.
  const sockets = new Set<net.Socket>()
  server.on('connection', (socket: net.Socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
  })

  // Tunnel WebSocket upgrades (e.g. the bifur client) straight through to the
  // upstream: forward the HTTP/1.1 handshake, then pipe raw bytes both ways.
  // Fault scenarios don't apply to tunneled sockets — this exists so socket
  // connections keep working through the proxy instead of failing outright.
  // (Browsers send WebSocket upgrades over HTTP/1.1, which the h2 listener
  // accepts via its ALPN fallback.)
  server.on('upgrade', (req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer) => {
    const requestHost = req.headers.host
    const derived = requestHost ? deriveProjectId(requestHost) : {error: 'missing host'}
    let upstreamUrl: URL | undefined
    try {
      upstreamUrl = derived.error
        ? undefined
        : new URL(`https://${derived.projectId ? `${derived.projectId}.` : ''}${apiHost}`)
    } catch {
      upstreamUrl = undefined
    }
    if (!req.url || !upstreamUrl) {
      clientSocket.destroy()
      return
    }

    const upstreamSocket = tls.connect({
      host: upstreamUrl.hostname,
      port: upstreamUrl.port ? Number(upstreamUrl.port) : 443,
      rejectUnauthorized: !insecureUpstream,
      ALPNProtocols: ['http/1.1'],
      ...(net.isIP(upstreamUrl.hostname) ? {} : {servername: upstreamUrl.hostname}),
    })
    upstreamSocket.on('secureConnect', () => {
      // Replay the upgrade request verbatim (rawHeaders preserves casing and
      // repeats), with the host rewritten and the token injected
      const lines = [`${req.method ?? 'GET'} ${req.url} HTTP/1.1`, `host: ${upstreamUrl.host}`]
      if (token) {
        lines.push(`authorization: Bearer ${token}`)
      }
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const name = req.rawHeaders[i] ?? ''
        if (['host', 'authorization'].includes(name.toLowerCase())) {
          continue
        }
        lines.push(`${name}: ${req.rawHeaders[i + 1]}`)
      }
      upstreamSocket.write(`${lines.join('\r\n')}\r\n\r\n`)
      if (head.length > 0) {
        upstreamSocket.write(head)
      }
      clientSocket.pipe(upstreamSocket)
      upstreamSocket.pipe(clientSocket)
    })
    upstreamSocket.on('error', () => clientSocket.destroy())
    upstreamSocket.on('close', () => clientSocket.destroy())
    clientSocket.on('error', () => upstreamSocket.destroy())
    clientSocket.on('close', () => upstreamSocket.destroy())
  })

  const api: DebugProxyServer = {
    server,
    port,
    listen: () =>
      new Promise<DebugProxyServer>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, BIND_HOST, () => {
          server.off('error', reject)
          resolve(api)
        })
      }),
    close: () =>
      new Promise<void>((resolve, reject) => {
        for (const socket of sockets) {
          socket.destroy()
        }
        server.close((err) => (err ? reject(err) : resolve()))
      }),
  }

  return api
}

export type {
  MonoTypeOperatorFunction,
  ProxyHeaders,
  ProxyRequest,
  ProxyResponse,
  ProxyTarget,
  SSEEvent,
}
