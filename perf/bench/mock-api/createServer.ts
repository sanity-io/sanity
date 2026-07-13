import {
  createDebugProxy,
  type DebugProxyServer,
  type ProxyRequest,
  type ProxyResponse,
  writeResponseHead,
} from '@repo/debug-proxy'
import {Subscription} from 'rxjs'

import {BENCH_USER} from '../constants'
import {handleActions, handleDoc, handleMutate, handleQuery} from './data'
import {RequestLedger} from './ledger'
import {AUTH_PROBE, AUTH_PROVIDERS, DATASET_ACL, DATASETS, projectData} from './project'
import {corsHeaders, handlePreflight, json, readBody} from './respond'
import {ListenHub} from './sse'
import {DocumentStore} from './store'
import {type BenchDocument} from './types'
import {parkWebSocket} from './websocket'

export interface MockApiConfig {
  port: number
  projectId: string
  dataset: string
  /** TLS key/cert (PEM). Omit for a plain HTTP/1.1 listener (contract tests, bench:dev). */
  tls?: {key: string | Buffer; cert: string | Buffer}
}

export interface MockApiServer {
  listen: () => Promise<void>
  close: () => Promise<void>
  /** Origin the studio should use as `apiHost`. */
  url: string
  store: DocumentStore
  hub: ListenHub
  ledger: RequestLedger
}

/** Strip the `/vX.Y` API-version prefix @sanity/client puts on every path. */
function stripVersion(pathname: string): string {
  return pathname.replace(/^\/v[^/]+/, '')
}

/**
 * The mock Content Lake server. Built on @repo/debug-proxy purely as server
 * plumbing (listener, `<projectId>.localhost` host validation, HTTP/2+TLS);
 * every request is answered locally by the single handler below — there is
 * no upstream, no token, and no pass-through. Unknown endpoints 404 and are
 * recorded in the ledger (mock-drift detection). The `apiHost` passed to the
 * underlying proxy is intentionally unroutable so that its built-in
 * WebSocket upgrade tunneling (bifur) fails fast instead of leaking to the
 * real network.
 */
export function createMockApi(config: MockApiConfig): MockApiServer {
  const store = new DocumentStore()
  const hub = new ListenHub()
  const ledger = new RequestLedger()

  async function handle(req: ProxyRequest, res: ProxyResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const rawPath = url.pathname
    const path = stripVersion(rawPath)
    const method = req.method ?? 'GET'
    const contentLength = Number(req.headers['content-length'] ?? 0)

    const record = (endpointClass: string, bytesOut: number) =>
      ledger.record({
        method,
        path: rawPath,
        endpointClass,
        bytesIn: contentLength,
        bytesOut,
        at: Date.now(),
      })

    if (method === 'OPTIONS') {
      handlePreflight(req, res)
      return
    }

    // --- control plane (no version prefix, never CORS-relevant) -------------
    if (rawPath === '/_bench/reset' && method === 'POST') {
      hub.closeAll()
      store.reset()
      ledger.reset()
      json(req, res, 200, {ok: true})
      return
    }
    if (rawPath === '/_bench/seed' && method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf8')) as {
        documents: BenchDocument[]
      }
      store.seed(body.documents)
      json(req, res, 200, {ok: true, count: body.documents.length})
      return
    }
    if (rawPath === '/_bench/requests' && method === 'GET') {
      json(req, res, 200, ledger.snapshot())
      return
    }

    // --- auth / user ---------------------------------------------------------
    if (path.startsWith('/users/me')) {
      if (path === '/users/me') {
        record('auth', json(req, res, 200, BENCH_USER))
        return
      }
      const keyvalueMatch = path.match(/^\/users\/me\/keyvalue(?:\/(.*))?$/)
      if (keyvalueMatch) {
        // UI-state persistence (serverStorage.ts). GET answers null for every
        // requested key; PUT echoes the submitted pairs. Nothing persists —
        // sessions must not inherit UI state from each other.
        if (method === 'GET') {
          const keys = decodeURIComponent(keyvalueMatch[1] ?? '')
            .split(',')
            .filter(Boolean)
          record(
            'keyvalue',
            json(
              req,
              res,
              200,
              keys.map((key) => ({key, value: null})),
            ),
          )
          return
        }
        const body = JSON.parse((await readBody(req)).toString('utf8'))
        record('keyvalue', json(req, res, 200, body))
        return
      }
      ledger.recordUnexpected(method, rawPath)
      record('auth', json(req, res, 404, {error: 'not implemented in bench mock'}))
      return
    }
    if (path === '/auth/id') {
      record('auth', json(req, res, 200, AUTH_PROBE()))
      return
    }
    if (path === '/auth/providers') {
      record('auth', json(req, res, 200, AUTH_PROVIDERS))
      return
    }
    if (path === '/auth/logout') {
      record('auth', json(req, res, 200, {ok: true}))
      return
    }

    // --- project metadata ----------------------------------------------------
    const aclMatch = path.match(/^\/projects\/([^/]+)\/datasets\/([^/]+)\/acl$/)
    if (aclMatch) {
      record('project', json(req, res, 200, DATASET_ACL))
      return
    }
    const projectSubMatch = path.match(/^\/projects\/([^/]+)(\/.*)?$/)
    if (projectSubMatch) {
      const sub = projectSubMatch[2] ?? ''
      if (sub === '' || sub === '/') {
        record('project', json(req, res, 200, projectData(config.projectId)))
        return
      }
      if (sub === '/datasets' || sub.startsWith('/datasets?')) {
        record('project', json(req, res, 200, DATASETS))
        return
      }
      if (sub === '/grants') {
        record('project', json(req, res, 200, {}))
        return
      }
      if (sub === '/user-applications') {
        record('project', json(req, res, 200, []))
        return
      }
      ledger.recordUnexpected(method, rawPath)
      record('project', json(req, res, 404, {error: 'not implemented in bench mock'}))
      return
    }
    if (path === '/features' || path.startsWith('/features/')) {
      record('features', json(req, res, 200, []))
      return
    }
    if (path.startsWith('/journey')) {
      record('journey', json(req, res, 200, null))
      return
    }
    if (path === '/ping' || path.startsWith('/data/ping')) {
      record('ping', json(req, res, 200, {pong: true}, {'x-sanity-shard': 'bench'}))
      return
    }
    if (path === '/intake/telemetry-status') {
      // Telemetry consent (StudioTelemetryProvider) — denied keeps the
      // studio from batching/sending events: deterministic and quiet
      record('telemetry', json(req, res, 200, {status: 'denied'}))
      return
    }
    if (path === '/help') {
      // Navbar help resources + module version check (helpResources.ts) —
      // every field of ResourcesResponse is optional
      record('help', json(req, res, 200, {}))
      return
    }
    if (path.match(/^\/agent\/[^/]+\/bundles\/.*listen/)) {
      // Dashboard-bridge bundle listener — park it on an empty event stream
      // so it doesn't 404-retry-loop
      record('agent', 0)
      hub.connect(res, [], corsHeaders(req))
      return
    }

    // --- data ----------------------------------------------------------------
    const eventsMatch = path.match(/^\/data\/history\/([^/]+)\/events\/documents\//)
    if (eventsMatch && method === 'GET') {
      // The events store fetches this on document open (not lazily) and logs
      // a console error on failure — answer with an empty event list
      // (shape: getInitialFetchEvents.ts)
      record('history', json(req, res, 200, {events: {}, nextCursor: ''}))
      return
    }
    const translogMatch = path.match(/^\/data\/history\/([^/]+)\/transactions\//)
    if (translogMatch && method === 'GET') {
      // NDJSON stream of transactions; an empty body means no history
      // (shape: getTransactionsLogs.ts). Also fetched on document open.
      writeResponseHead(res, 200, undefined, {
        ...corsHeaders(req),
        'content-type': 'application/x-ndjson',
      })
      res.end()
      record('history', 0)
      return
    }
    const listenMatch = path.match(/^\/data\/listen\/([^/]+)$/)
    if (listenMatch && method === 'GET') {
      const idsParam = url.searchParams.get('$ids')
      const ids = idsParam ? (JSON.parse(idsParam) as string[]) : null
      record('listen', 0)
      hub.connect(res, ids, corsHeaders(req))
      return
    }
    const docMatch = path.match(/^\/data\/doc\/([^/]+)\/(.+)$/)
    if (docMatch && method === 'GET') {
      record('doc', handleDoc(req, res, store, docMatch[2]))
      return
    }
    const queryMatch = path.match(/^\/data\/query\/([^/]+)/)
    if (queryMatch) {
      record('query', await handleQuery(req, res, store, url))
      return
    }
    const mutateMatch = path.match(/^\/data\/mutate\/([^/]+)/)
    if (mutateMatch && method === 'POST') {
      record('mutate', await handleMutate(req, res, store, hub))
      return
    }
    const actionsMatch = path.match(/^\/data\/actions\/([^/]+)/)
    if (actionsMatch) {
      if (method === 'GET') {
        // Actions feature toggle (see e2e/helpers/mockActionsFeatureToggle.ts)
        record('actions', json(req, res, 200, {enabled: true, compatibleStudioVersions: '*'}))
        return
      }
      record('actions', await handleActions(req, res, store, hub))
      return
    }

    // --- unknown -------------------------------------------------------------
    ledger.recordUnexpected(method, rawPath)
    record('other', json(req, res, 404, {error: `bench mock: no handler for ${method} ${rawPath}`}))
  }

  const proxy: DebugProxyServer = createDebugProxy({
    port: config.port,
    // Deliberately unroutable: the debug-proxy tunnels WebSocket upgrades to
    // this host, and the bench must never reach a real network. The RFC 2606
    // `.invalid` TLD is guaranteed not to resolve, so any leak fails fast at
    // DNS. (It must be a *name*, not an IP — the proxy prefixes the projectId,
    // and `benchexp.127.0.0.1` is not a valid URL host.)
    apiHost: 'bench.invalid',
    tls: config.tls,
    routes: [],
    // bifur presence socket: accept-and-park (see websocket.ts)
    upgradeHandler: parkWebSocket,
    defaultHandler: (req, res) => {
      handle(req, res).catch((error) => {
        console.error('[bench-mock] handler error:', error)
        if (!res.headersSent) {
          json(req, res, 500, {error: error instanceof Error ? error.message : String(error)})
        } else if (!res.writableEnded) {
          res.end()
        }
      })
      return Subscription.EMPTY
    },
  })

  const protocol = config.tls ? 'https' : 'http'

  return {
    listen: async () => {
      await proxy.listen()
    },
    close: async () => {
      hub.closeAll()
      await proxy.close()
    },
    url: `${protocol}://localhost:${config.port}`,
    store,
    hub,
    ledger,
  }
}
