import {type RequestCategory, type RequestEntry} from './network'
import {type MainThreadTime} from './trace'

export interface ByteCount {
  count: number
  decodedBytes: number
  transferBytes: number
}

export interface ChainSplit {
  /** Time at least one request of the chain was on the network. */
  networkMs: number
  /** Time between the chain's requests with none of them in flight (main thread or queueing). */
  gapMs: number
  /** From the chain's last response to ready (rendering the navbar). */
  tailMs: number
}

/** What a single traced load did until it was ready. */
export interface Waterfall {
  path: string
  readyMs: number
  /** Requests started before ready. */
  requests: number
  transferBytes: number
  decodedBytes: number
  byCategory: Partial<Record<RequestCategory, ByteCount>>
  /**
   * The requests that, each started by the previous one, lead to the last response before
   * ready: the serial dependency chain the page waited on.
   */
  chain: RequestEntry[]
  chainSplit: ChainSplit
  /** The document, API calls, preflights, fonts and scripts from other origins. */
  notable: RequestEntry[]
  /** `null` when the trace has no ready mark. */
  mainThread: MainThreadTime | null
  files: {network: string; trace: string}
}

/** Bytes received before ready, over all requests of the given categories. */
export function countBytes(requests: RequestEntry[], categories?: RequestCategory[]): ByteCount {
  const total: ByteCount = {count: 0, decodedBytes: 0, transferBytes: 0}
  for (const request of requests) {
    if (categories && !categories.includes(request.category)) continue
    total.count++
    total.decodedBytes += request.decodedBytes
    total.transferBytes += request.transferBytes
  }
  return total
}

const CHAIN_CATEGORIES: RequestCategory[] = ['document', 'js', 'css', 'api', 'preflight']

const withoutHash = (url: string) => url.split('#')[0]

/**
 * Start of the main-thread task running at `ms` (ms from navigation start), or `ms` itself when
 * the thread was idle or there is no trace.
 */
export function taskStartLookup(tasks: Array<[number, number]>): (ms: number) => number {
  return (ms) => tasks.find(([start, end]) => start <= ms && ms <= end)?.[0] ?? ms
}

/**
 * The serial chain of requests the page waited on before it was ready, walked back from ready:
 *
 * - A request the HTML parser or module loader made (a script tag, a static import, a font in a
 *   stylesheet) waited on the file that referenced it.
 * - A request a preflight was sent for waited on the preflight.
 * - A request issued by code (`fetch`, a dynamic `import()`) and ready itself waited on the
 *   latest response that finished before the main-thread task that issued it (or set the ready
 *   mark) started: that response is what let the task run.
 */
export function serialChain(
  requests: RequestEntry[],
  readyMs: number,
  taskStart: (ms: number) => number = (ms) => ms,
): RequestEntry[] {
  const byId = new Map(requests.map((request) => [request.id, request]))
  const preflightOf = new Map<string, RequestEntry>()
  for (const request of requests) {
    if (request.category === 'preflight' && request.initiator.requestId) {
      preflightOf.set(request.initiator.requestId, request)
    }
  }
  // A finished preflight lets the browser send the request, not the page's code run.
  const candidates = requests.filter(
    (request) =>
      CHAIN_CATEGORIES.includes(request.category) &&
      request.category !== 'preflight' &&
      !request.failed &&
      request.endMs !== null,
  )
  const lastResponseBefore = (time: number) => {
    let found: RequestEntry | undefined
    for (const request of candidates) {
      if (request.endMs! <= time && (!found || request.endMs! > found.endMs!)) found = request
    }
    return found
  }
  // The latest load of `url` that started before `time`.
  const loaderOf = (url: string, time: number) => {
    let found: RequestEntry | undefined
    for (const request of requests) {
      if (request.startMs > time) break
      if (withoutHash(request.url) === withoutHash(url)) found = request
    }
    return found
  }
  const issuedAfter = (request: RequestEntry) => {
    // Some module imports name a pseudo URL (`about:client`) that nothing loaded.
    const loader =
      request.initiator.fromCode || !request.initiator.url
        ? undefined
        : loaderOf(request.initiator.url, request.startMs)
    return loader ?? lastResponseBefore(taskStart(request.startMs))
  }
  const parentOf = (request: RequestEntry): RequestEntry | undefined => {
    if (request.category === 'preflight') {
      const actual = request.initiator.requestId ? byId.get(request.initiator.requestId) : undefined
      return issuedAfter(actual && actual !== request ? actual : request)
    }
    const preflight = preflightOf.get(request.id)
    if (preflight && preflight.endMs !== null) return preflight
    return issuedAfter(request)
  }

  const last = lastResponseBefore(taskStart(readyMs))
  const chain: RequestEntry[] = []
  const seen = new Set<RequestEntry>()
  for (let link = last; link && !seen.has(link); link = parentOf(link)) {
    seen.add(link)
    chain.unshift(link)
  }
  return chain
}

export function splitChain(chain: RequestEntry[], readyMs: number): ChainSplit {
  if (chain.length === 0) return {gapMs: 0, networkMs: 0, tailMs: readyMs}
  const intervals = chain
    .map((link) => [link.startMs, link.endMs ?? readyMs] as const)
    .toSorted((a, b) => a[0] - b[0])
  let networkMs = 0
  let coveredUntil = -Infinity
  for (const [start, end] of intervals) {
    const from = Math.max(start, coveredUntil)
    if (end > from) networkMs += end - from
    coveredUntil = Math.max(coveredUntil, end)
  }
  const first = intervals[0][0]
  return {
    gapMs: coveredUntil - first - networkMs,
    networkMs,
    tailMs: readyMs - coveredUntil,
  }
}

export function buildWaterfall(options: {
  files: Waterfall['files']
  mainThread: MainThreadTime | null
  path: string
  readyMs: number
  requests: RequestEntry[]
  /** Main-thread tasks from the trace (`mainThreadTasks`), empty without one. */
  tasks: Array<[number, number]>
}): Waterfall {
  const {files, mainThread, path, readyMs, requests, tasks} = options
  const documentOrigin = new URL(
    requests.find((request) => request.category === 'document')?.url ?? 'about:blank',
  ).origin
  const byCategory: Waterfall['byCategory'] = {}
  for (const request of requests) {
    byCategory[request.category] ??= {count: 0, decodedBytes: 0, transferBytes: 0}
  }
  for (const category of Object.keys(byCategory) as RequestCategory[]) {
    byCategory[category] = countBytes(requests, [category])
  }
  const total = countBytes(requests)
  const chain = serialChain(requests, readyMs, taskStartLookup(tasks))
  return {
    byCategory,
    chain,
    chainSplit: splitChain(chain, readyMs),
    decodedBytes: total.decodedBytes,
    files,
    mainThread,
    notable: requests.filter(
      (request) =>
        ['document', 'api', 'preflight', 'font'].includes(request.category) ||
        (request.category === 'js' && new URL(request.url).origin !== documentOrigin),
    ),
    path,
    readyMs,
    requests: total.count,
    transferBytes: total.transferBytes,
  }
}
