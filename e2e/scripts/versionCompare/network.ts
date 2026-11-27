import {type CDPSession} from '@playwright/test'

export type RequestCategory = 'document' | 'js' | 'css' | 'font' | 'api' | 'preflight' | 'other'

/** One request that started before the page was ready, with times in ms from navigation start. */
export interface RequestEntry {
  id: string
  url: string
  method: string
  /** The CDP resource type: `Document`, `Script`, `Fetch`, `Preflight`, `Font`, ... */
  resourceType: string
  category: RequestCategory
  /** `http/1.1`, `h2`, ... as Chrome reports it. */
  protocol: string | null
  status: number | null
  initiator: {
    type: string
    url: string | null
    requestId: string | null
    /**
     * Issued by running JS (`fetch`, dynamic `import()`), so `url` is only the file that made the
     * call; otherwise the HTML parser or module loader requested it on behalf of `url`.
     */
    fromCode: boolean
  }
  startMs: number
  /** Response headers received. */
  responseMs: number | null
  /** Finished or failed; `null` when still loading at ready. */
  endMs: number | null
  /**
   * From the request being issued until it was sent: queueing for a connection (at most six per
   * origin over HTTP/1.1), DNS, connecting and TLS.
   */
  queuedMs: number | null
  /** From sending the request until the first byte of the response (TTFB). */
  waitMs: number | null
  /** Bytes on the wire (headers and compressed body) received until ready. */
  transferBytes: number
  /** Body bytes after decompression received until ready. */
  decodedBytes: number
  failed: string | null
}

export interface NetworkEvent {
  method: string
  params: Record<string, unknown>
}

const RECORDED_EVENTS = [
  'Network.requestWillBeSent',
  'Network.requestWillBeSentExtraInfo',
  'Network.responseReceived',
  'Network.responseReceivedExtraInfo',
  'Network.dataReceived',
  'Network.loadingFinished',
  'Network.loadingFailed',
] as const

interface CdpInitiator {
  type: string
  url?: string
  requestId?: string
  stack?: CdpStack
}

interface CdpStack {
  callFrames: Array<{url: string}>
  parent?: CdpStack
}

/** The first script URL on the initiator's async stack, if any. */
function stackUrl(stack: CdpStack | undefined): string | null {
  for (let current = stack; current; current = current.parent) {
    const frame = current.callFrames.find((callFrame) => callFrame.url)
    if (frame) return frame.url
  }
  return null
}

function categorize(method: string, resourceType: string): RequestCategory {
  if (method === 'OPTIONS' || resourceType === 'Preflight') return 'preflight'
  switch (resourceType) {
    case 'Document':
      return 'document'
    case 'Script':
      return 'js'
    case 'Stylesheet':
      return 'css'
    case 'Font':
      return 'font'
    case 'Fetch':
    case 'XHR':
    case 'EventSource':
    case 'WebSocket':
      return 'api'
    default:
      return 'other'
  }
}

export interface NetworkRecorder {
  /**
   * Requests that started at or before `readyMs` (ms from navigation start, as `performance.now()`
   * measures it), and the raw CDP events for them up to that point.
   */
  finish(navigation: {timeOriginMs: number; readyMs: number}): {
    events: NetworkEvent[]
    requests: RequestEntry[]
  }
}

/** Records CDP Network events on `cdp`, which must have the Network domain enabled. */
export function recordNetwork(cdp: CDPSession): NetworkRecorder {
  const events: NetworkEvent[] = []
  for (const method of RECORDED_EVENTS) {
    cdp.on(method, (params: object) => {
      events.push({method, params: params as Record<string, unknown>})
    })
  }

  return {
    finish({timeOriginMs, readyMs}) {
      // CDP timestamps are monotonic seconds; `wallTime` on the document request ties them to
      // the wall clock that `performance.timeOrigin` uses.
      const documentRequest = events.find(
        (event) =>
          event.method === 'Network.requestWillBeSent' && event.params['type'] === 'Document',
      )
      if (!documentRequest) return {events: [], requests: []}
      const clockOffset =
        (documentRequest.params['wallTime'] as number) -
        (documentRequest.params['timestamp'] as number)
      const toMs = (timestamp: number) => (timestamp + clockOffset) * 1000 - timeOriginMs
      const readyAt = readyMs / 1000 + timeOriginMs / 1000 - clockOffset

      const byId = new Map<string, RequestEntry>()
      const beforeReady = events.filter((event) => {
        const timestamp = event.params['timestamp'] as number | undefined
        return timestamp === undefined || timestamp <= readyAt
      })
      for (const event of beforeReady) {
        const {params} = event
        const requestId = params['requestId'] as string
        const timestamp = params['timestamp'] as number | undefined
        if (event.method === 'Network.requestWillBeSent') {
          const request = params['request'] as {url: string; method: string}
          const resourceType = (params['type'] as string | undefined) ?? 'Other'
          const initiator = params['initiator'] as CdpInitiator
          // A redirect reuses the request id: the latest hop is the one that loads.
          byId.set(requestId, {
            category: categorize(request.method, resourceType),
            decodedBytes: 0,
            endMs: null,
            failed: null,
            id: requestId,
            initiator: {
              fromCode: initiator.stack !== undefined,
              requestId: initiator.requestId ?? null,
              type: initiator.type,
              url: initiator.url || stackUrl(initiator.stack),
            },
            method: request.method,
            protocol: null,
            queuedMs: null,
            resourceType,
            responseMs: null,
            startMs: toMs(timestamp!),
            status: null,
            transferBytes: 0,
            url: request.url,
            waitMs: null,
          })
        }
        const entry = byId.get(requestId)
        if (!entry) continue
        switch (event.method) {
          case 'Network.responseReceived': {
            const response = params['response'] as {
              protocol?: string
              status: number
              timing?: {
                requestTime: number
                sendEnd: number
                sendStart: number
                receiveHeadersEnd: number
                receiveHeadersStart?: number
              }
            }
            entry.status = response.status
            entry.protocol = response.protocol ?? null
            entry.responseMs = toMs(timestamp!)
            if (response.timing) {
              const {receiveHeadersEnd, receiveHeadersStart, requestTime, sendStart} =
                response.timing
              const firstByte =
                receiveHeadersStart && receiveHeadersStart > 0
                  ? receiveHeadersStart
                  : receiveHeadersEnd
              entry.queuedMs = Math.max(0, toMs(requestTime) + sendStart - entry.startMs)
              entry.waitMs = Math.max(0, firstByte - sendStart)
            }
            break
          }
          case 'Network.dataReceived':
            entry.transferBytes += params['encodedDataLength'] as number
            entry.decodedBytes += params['dataLength'] as number
            break
          case 'Network.loadingFinished':
            entry.endMs = toMs(timestamp!)
            // The total also covers headers, and some responses report nothing per chunk.
            entry.transferBytes = Math.max(
              entry.transferBytes,
              params['encodedDataLength'] as number,
            )
            break
          case 'Network.loadingFailed':
            entry.endMs = toMs(timestamp!)
            entry.failed = params['errorText'] as string
            break
          default:
            break
        }
      }
      return {
        events: beforeReady.filter((event) => byId.has(event.params['requestId'] as string)),
        requests: [...byId.values()].toSorted((a, b) => a.startMs - b.startMs),
      }
    },
  }
}
