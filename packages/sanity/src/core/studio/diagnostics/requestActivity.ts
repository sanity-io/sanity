import {type ClientConfig} from '@sanity/client'

import {getRequestBucket} from './requestPerformance'

type ResolveFetch = NonNullable<ClientConfig['resolveFetch']>

/**
 * The fetch signature the client resolves through `resolveFetch`. Every client request goes
 * through it, including EventSource (listener) connections.
 *
 * @internal
 */
export type TrackedFetchFunction = ReturnType<ResolveFetch>

type TrackedFetchInit = Parameters<TrackedFetchFunction>[1]

/** @internal */
export type RequestActivityKind = 'listen' | 'live' | 'request'

/** @internal */
export interface PendingRequestSummary {
  ageMs: number
  /** The data API operation, eg `query` or `doc`, when the URL is a data API URL */
  bucket?: string
  kind: RequestActivityKind
  projectId?: string
  tag?: string
}

/** @internal */
export interface RequestActivitySnapshot {
  /** Listeners and other event streams that are connected right now */
  openStreams: number
  /** Requests (including listeners) that have started but not yet received response headers */
  pendingRequests: number
  /** How long the longest-waiting pending request has been waiting */
  oldestPendingMs?: number
  /** The longest-waiting pending requests, longest first. Only identifies the request type and tag. */
  longestPending: PendingRequestSummary[]
  /** Requests started in this tab since tracking began */
  totalStarted: number
}

/**
 * Request activity over a period of time, for telemetry. Counts are per window rather than per
 * session, so they're comparable regardless of how long the tab has been open.
 *
 * @internal
 */
export interface RequestActivityWindowSummary {
  /** How long the window covered */
  windowMs: number
  /** Most listeners and other event streams open at the same time */
  peakOpenStreams: number
  /** Most requests waiting for response headers at the same time */
  peakPendingRequests: number
  /** Most open streams plus waiting requests at the same time: this tab's share of the connection's ~100 request budget */
  peakInFlight: number
  /** Longest time a request waited for response headers, including requests still waiting */
  longestWaitMs: number
  /** Requests started during the window, including listeners */
  requestsStarted: number
  /** Listeners and other event streams started during the window. A high number means connections are churning. */
  streamsStarted: number
}

/** @internal */
export interface TrackedRequest {
  /** Response headers arrived */
  responded: () => void
  /** The request finished, failed or was aborted */
  end: () => void
}

/** @internal */
export interface RequestActivityTracker {
  getSnapshot: () => RequestActivitySnapshot
  start: (url: string, options: {stream: boolean}) => TrackedRequest
  /** Summarizes activity since the previous call (or since tracking began), and starts a new window */
  takeWindowSummary: () => RequestActivityWindowSummary
}

interface ActivityWindow {
  longestWaitMs: number
  peakInFlight: number
  peakOpenStreams: number
  peakPendingRequests: number
  requestsStarted: number
  startedAt: number
  streamsStarted: number
}

interface ActiveRequest {
  bucket?: string
  kind: RequestActivityKind
  projectId?: string
  startedAt: number
  state: 'pending' | 'open'
  stream: boolean
  tag?: string
}

const MAX_PENDING_DETAILS = 5

/**
 * Keeps track of the requests this tab currently has in flight. Browsers allow about 100
 * requests in flight per HTTP/2 or HTTP/3 connection, shared by every tab, and listeners hold
 * one for as long as they are open. When that budget runs out, new requests wait in the
 * browser's queue without ever reaching the network, which looks like a network outage from
 * the outside.
 *
 * @internal
 */
export function createRequestActivityTracker(
  now: () => number = () => performance.now(),
): RequestActivityTracker {
  const active = new Set<ActiveRequest>()
  let totalStarted = 0
  let openStreams = 0
  let pendingRequests = 0
  let activityWindow = createWindow(now(), 0, 0)

  function updatePeaks() {
    activityWindow.peakOpenStreams = Math.max(activityWindow.peakOpenStreams, openStreams)
    activityWindow.peakPendingRequests = Math.max(
      activityWindow.peakPendingRequests,
      pendingRequests,
    )
    activityWindow.peakInFlight = Math.max(
      activityWindow.peakInFlight,
      openStreams + pendingRequests,
    )
  }

  function stopWaiting(request: ActiveRequest) {
    pendingRequests -= 1
    activityWindow.longestWaitMs = Math.max(activityWindow.longestWaitMs, now() - request.startedAt)
  }

  return {
    getSnapshot: () => {
      const currentTime = now()
      const requests = [...active]
      const pending = requests
        .filter((request) => request.state === 'pending')
        .sort((a, b) => a.startedAt - b.startedAt)

      return {
        longestPending: pending.slice(0, MAX_PENDING_DETAILS).map((request) => ({
          ageMs: round(currentTime - request.startedAt),
          bucket: request.bucket,
          kind: request.kind,
          projectId: request.projectId,
          tag: request.tag,
        })),
        oldestPendingMs: pending[0] ? round(currentTime - pending[0].startedAt) : undefined,
        openStreams: requests.filter((request) => request.state === 'open').length,
        pendingRequests: pending.length,
        totalStarted,
      }
    },

    start: (url, {stream}) => {
      totalStarted += 1
      activityWindow.requestsStarted += 1
      if (stream) activityWindow.streamsStarted += 1

      const request: ActiveRequest = {
        ...describeRequest(url, stream),
        startedAt: now(),
        state: 'pending',
        stream,
      }
      active.add(request)
      pendingRequests += 1
      updatePeaks()

      return {
        responded: () => {
          if (!active.has(request) || request.state !== 'pending') return
          stopWaiting(request)
          // Regular requests only hold their slot briefly once the response arrives
          if (request.stream) {
            request.state = 'open'
            openStreams += 1
          } else {
            active.delete(request)
          }
          updatePeaks()
        },
        end: () => {
          if (!active.delete(request)) return
          if (request.state === 'pending') stopWaiting(request)
          else openStreams -= 1
        },
      }
    },

    takeWindowSummary: () => {
      const currentTime = now()
      let longestWaitMs = activityWindow.longestWaitMs
      for (const request of active) {
        if (request.state === 'pending') {
          longestWaitMs = Math.max(longestWaitMs, currentTime - request.startedAt)
        }
      }

      const summary: RequestActivityWindowSummary = {
        longestWaitMs: round(longestWaitMs),
        peakInFlight: activityWindow.peakInFlight,
        peakOpenStreams: activityWindow.peakOpenStreams,
        peakPendingRequests: activityWindow.peakPendingRequests,
        requestsStarted: activityWindow.requestsStarted,
        streamsStarted: activityWindow.streamsStarted,
        windowMs: round(currentTime - activityWindow.startedAt),
      }

      // Whatever is still open carries over as the starting point of the next window
      activityWindow = createWindow(currentTime, openStreams, pendingRequests)
      return summary
    },
  }
}

function createWindow(
  startedAt: number,
  openStreams: number,
  pendingRequests: number,
): ActivityWindow {
  return {
    longestWaitMs: 0,
    peakInFlight: openStreams + pendingRequests,
    peakOpenStreams: openStreams,
    peakPendingRequests: pendingRequests,
    requestsStarted: 0,
    startedAt,
    streamsStarted: 0,
  }
}

/**
 * Wraps a fetch implementation so every request made through it is tracked. Pass it to a client
 * as `resolveFetch` to cover both regular requests and EventSource connections.
 *
 * The response is passed through untouched. For event streams, a clone of the body is drained in
 * parallel to learn when the server ends the stream.
 *
 * @internal
 */
export function createTrackedFetch(
  tracker: RequestActivityTracker,
  getBaseFetch: () => TrackedFetchFunction = getGlobalFetch,
): TrackedFetchFunction {
  return function trackedFetch(input, init) {
    const stream = isEventStreamRequest(input, init)
    const request = tracker.start(input, {stream})

    const signal = init?.signal
    if (signal?.aborted) request.end()
    else signal?.addEventListener('abort', request.end, {once: true})

    let response: ReturnType<TrackedFetchFunction>
    try {
      response = getBaseFetch()(input, init)
    } catch (error) {
      request.end()
      throw error
    }

    return response.then(
      (result) => {
        request.responded()
        if (stream) watchStreamEnd(result, request.end)
        return result
      },
      (error: unknown) => {
        request.end()
        throw error
      },
    )
  }
}

/** Request activity for this browser tab, shared by every Studio client and the diagnostics panel */
export const studioRequestActivity: RequestActivityTracker = createRequestActivityTracker()

/**
 * A `resolveFetch` client option that records every request in {@link studioRequestActivity},
 * on top of the fetch the client would otherwise use.
 *
 * @internal
 */
export function createStudioResolveFetch(resolveFetch?: ResolveFetch): ResolveFetch {
  return (proxyUrl) =>
    createTrackedFetch(
      studioRequestActivity,
      resolveFetch ? () => resolveFetch(proxyUrl) : getGlobalFetch,
    )
}

function getGlobalFetch(): TrackedFetchFunction {
  return globalThis.fetch.bind(globalThis)
}

function watchStreamEnd(response: Awaited<ReturnType<TrackedFetchFunction>>, end: () => void) {
  // Only native responses can be cloned. Without a clone we fall back to the abort signal, which
  // the EventSource implementation fires whenever it closes a connection.
  if (typeof Response === 'undefined' || !(response instanceof Response) || !response.body) return

  let copy: Response
  try {
    copy = response.clone()
  } catch {
    return
  }

  void copy.body?.pipeTo(new WritableStream()).then(end, end)
}

function isEventStreamRequest(url: string, init: TrackedFetchInit): boolean {
  const accept = new Headers(init?.headers).get('accept')
  if (accept?.includes('text/event-stream')) return true

  const kind = getRequestKind(url)
  return kind === 'listen' || kind === 'live'
}

function describeRequest(
  url: string,
  stream: boolean,
): Pick<ActiveRequest, 'bucket' | 'kind' | 'projectId' | 'tag'> {
  const kind = getRequestKind(url)

  let parsed: URL | undefined
  try {
    parsed = new URL(url)
  } catch {
    // Relative or malformed URL: report the kind only
  }

  return {
    bucket: getRequestBucket(url)?.bucket,
    kind: kind === 'request' && stream ? 'listen' : kind,
    projectId: parsed ? getProjectId(parsed.hostname) : undefined,
    tag: parsed?.searchParams.get('tag') ?? undefined,
  }
}

function getRequestKind(url: string): RequestActivityKind {
  if (url.includes('/data/listen/')) return 'listen'
  if (url.includes('/live/events')) return 'live'
  return 'request'
}

function getProjectId(hostname: string): string | undefined {
  const match = hostname.match(/^([a-z0-9-]+)\.(?:api|apicdn)\.sanity\.(?:io|work)$/)
  return match?.[1]
}

function round(value: number): number {
  return Math.round(value)
}
