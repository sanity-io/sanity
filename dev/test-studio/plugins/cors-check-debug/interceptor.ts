import {type SanityClient} from 'sanity'

export interface CorsVerdict {
  allowed: boolean
  withCredentials: boolean
}

export type LogTone = 'positive' | 'caution' | 'critical'

export interface LogEntry {
  id: number
  time: number
  tone?: LogTone
  text: string
}

export interface CorsCheckDebugState {
  simulateManagedOrigin: boolean
  liveConnections: number
  log: readonly LogEntry[]
}

export type Outcome<T> = {ok: true; value: T} | {ok: false; error: string}

export interface CorsCheckResult {
  checkCors: Outcome<{body: string; verdict: CorsVerdict | null}>
  /** A credentialed request only resolves when the API's CORS headers accept the origin */
  credentialedRequest: Outcome<{status: number}>
}

/** What `/check/cors` answers a managed origin today, e.g. `https://icons.sanity.studio` */
export const MANAGED_ORIGIN_BODY = JSON.stringify({
  result: {allowed: false, withCredentials: false},
})

const MAX_LOG_ENTRIES = 200

let state: CorsCheckDebugState = {simulateManagedOrigin: false, liveConnections: 0, log: []}
let nextLogId = 0
let nativeFetch: typeof fetch | undefined
const listeners = new Set<() => void>()
const dropConnectionCallbacks = new Set<() => void>()

function update(patch: Partial<CorsCheckDebugState>): void {
  state = {...state, ...patch}
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot(): CorsCheckDebugState {
  return state
}

export function logEvent(text: string, tone?: LogTone): void {
  const entry: LogEntry = {id: nextLogId++, time: Date.now(), tone, text}
  update({log: [...state.log, entry].slice(-MAX_LOG_ENTRIES)})
}

export function clearLog(): void {
  update({log: []})
}

export function setSimulateManagedOrigin(simulateManagedOrigin: boolean): void {
  update({simulateManagedOrigin})
  logEvent(
    simulateManagedOrigin
      ? `Simulating a managed origin: /check/cors now answers ${MANAGED_ORIGIN_BODY}`
      : 'Stopped simulating a managed origin: /check/cors requests reach the API again',
    simulateManagedOrigin ? 'caution' : undefined,
  )
}

export function dropLiveConnections(): void {
  const callbacks = [...dropConnectionCallbacks]
  logEvent(
    `Dropped ${callbacks.length} live connection${callbacks.length === 1 ? '' : 's'}: the response body failed with TypeError("network error"), as Chrome does on sleep/wake`,
    'caution',
  )
  for (const drop of callbacks) drop()
}

/** Asks the API directly, so the simulated answer never applies here */
export async function checkCorsNow(client: SanityClient): Promise<CorsCheckResult> {
  const request = nativeFetch ?? fetch
  const [checkCors, credentialedRequest] = await Promise.all([
    settle(async () => {
      const response = await request(client.getUrl('/check/cors', false), {credentials: 'omit'})
      const body = await response.text()
      return {body, verdict: parseVerdict(body)}
    }),
    settle(async () => {
      const response = await request(client.getUrl('/users/me', false), {credentials: 'include'})
      return {status: response.status}
    }),
  ])
  logEvent(
    `Checked from the panel: /check/cors → ${checkCors.ok ? checkCors.value.body : checkCors.error}`,
    checkCors.ok && isAccepted(checkCors.value.verdict) ? 'positive' : 'critical',
  )
  logEvent(
    `Checked from the panel: credentialed GET /users/me → ${
      credentialedRequest.ok
        ? `HTTP ${credentialedRequest.value.status}, CORS accepted the origin`
        : `${credentialedRequest.error}, blocked by CORS`
    }`,
    credentialedRequest.ok ? 'positive' : 'critical',
  )
  return {checkCors, credentialedRequest}
}

export function isAccepted(verdict: CorsVerdict | null): boolean {
  return verdict?.allowed === true && verdict.withCredentials
}

/**
 * Wraps the global `fetch`, which `@sanity/client` reads. It binds `fetch` for its `/check/cors`
 * request when `live.events()` is called, so this has to run before the Presentation tool
 * subscribes. Not `window.fetch`: the CLI evaluates the config with a jsdom `window` that has none.
 */
export function installCorsCheckInterceptor(): void {
  if (nativeFetch || typeof window === 'undefined') return
  const original = globalThis.fetch.bind(globalThis)
  nativeFetch = original
  globalThis.fetch = (input, init) => {
    const url = URL.parse(input instanceof Request ? input.url : String(input), location.href)
    if (url?.pathname.endsWith('/check/cors')) return fetchCheckCors(original, input, init, url)
    if (url?.pathname.includes('/data/live/events/')) {
      return fetchLiveEvents(original, input, init, url)
    }
    return original(input, init)
  }
}

async function fetchCheckCors(
  original: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  url: URL,
): Promise<Response> {
  if (state.simulateManagedOrigin) {
    logEvent(`${url.pathname} → ${MANAGED_ORIGIN_BODY} (simulated managed origin)`, 'critical')
    return new Response(MANAGED_ORIGIN_BODY, {headers: {'content-type': 'application/json'}})
  }
  const response = await original(input, init)
  const body = await response
    .clone()
    .text()
    .catch((err: unknown) => String(err))
  logEvent(`${url.pathname} → ${body}`, isAccepted(parseVerdict(body)) ? 'positive' : 'critical')
  return response
}

async function fetchLiveEvents(
  original: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  url: URL,
): Promise<Response> {
  const tag = url.searchParams.get('tag')
  const name = tag ? `Live events (${tag})` : 'Live events'
  // eventsource sends the id of the last event it received when it reconnects
  const reconnecting = new Headers(init?.headers).has('last-event-id')
  let response: Response
  try {
    response = await original(input, init)
  } catch (err) {
    if (!init?.signal?.aborted) logEvent(`${name}: request failed, ${String(err)}`, 'critical')
    throw err
  }
  if (!response.ok || !response.body) {
    logEvent(`${name}: HTTP ${response.status}`, 'critical')
    return response
  }
  logEvent(`${name}: ${reconnecting ? 'reconnected' : 'connected'}`, 'positive')
  return droppable(response, response.body)
}

/** Re-serves a streaming response through a body that `dropLiveConnections()` can fail */
function droppable(response: Response, upstreamBody: ReadableStream<Uint8Array>): Response {
  const upstream = upstreamBody.getReader()
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined
  let finished = false

  function finish(): boolean {
    if (finished) return false
    finished = true
    dropConnectionCallbacks.delete(drop)
    update({liveConnections: dropConnectionCallbacks.size})
    return true
  }
  function drop(): void {
    if (!finish()) return
    controller?.error(new TypeError('network error'))
    upstream.cancel().catch(() => undefined)
  }

  const body = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController
    },
    async pull(streamController) {
      try {
        const {done, value} = await upstream.read()
        if (finished) return
        if (done) {
          finish()
          streamController.close()
        } else {
          streamController.enqueue(value)
        }
      } catch (err) {
        if (finish()) streamController.error(err)
      }
    },
    cancel(reason) {
      finish()
      return upstream.cancel(reason)
    },
  })

  dropConnectionCallbacks.add(drop)
  update({liveConnections: dropConnectionCallbacks.size})
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

function parseVerdict(body: string): CorsVerdict | null {
  try {
    const parsed: unknown = JSON.parse(body)
    const result = isRecord(parsed) ? parsed.result : undefined
    if (!isRecord(result) || typeof result.allowed !== 'boolean') return null
    return {allowed: result.allowed, withCredentials: result.withCredentials === true}
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function settle<T>(run: () => Promise<T>): Promise<Outcome<T>> {
  try {
    return {ok: true, value: await run()}
  } catch (err) {
    return {ok: false, error: String(err)}
  }
}
