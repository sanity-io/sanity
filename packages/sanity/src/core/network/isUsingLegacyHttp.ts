import {type SanityClient} from '@sanity/client'
import {defer, firstValueFrom, map, type Observable, of} from 'rxjs'

/**
 * The /ping route is special in that it allows any origin to access it, and crucially
 * for this case: also allows _timing_ requests through the `timing-allow-origin` header.
 * This is what allows us to inspect the browser's Resource Timing entry for the request.
 */
const checkPath = '/ping'

/** The tag used to identify the request in the Performance API and server logs. */
const checkRequestTag = 'protocol-check'

const DEFAULT_TIMEOUT = 2_500

// The background warning is a one-shot check per client. Cache its promise so observable
// warm-up, remounts, and multiple subscribers cannot start duplicate requests. The detailed
// diagnostics API below remains uncached so an explicit rerun always captures a fresh result.
const legacyHttpChecks = new WeakMap<SanityClient, Promise<boolean | undefined>>()

/** @internal */
export interface ApiNetworkResourceTiming {
  connectionMs: number
  decodedBodySizeBytes: number
  dnsMs: number
  durationMs: number
  encodedBodySizeBytes: number
  initiatorType: string
  redirectMs: number
  requestToFirstByteMs: number
  responseTransferMs: number
  secureConnectionMs: number
  serverTiming: {description: string; durationMs: number; name: string}[]
  startTimeMs: number
  transferSizeBytes: number
}

/** @internal */
export interface ApiNetworkDiagnostic {
  durationMs: number
  error?: string
  protocol: string
  resourceTiming?: ApiNetworkResourceTiming
  responseOk?: boolean
  responseStatus?: number
  status: 'success' | 'timeout' | 'error' | 'unsupported'
  timedOut: boolean
}

/** @internal */
export interface ApiNetworkDiagnosticOptions {
  timeout?: number
}

/**
 * Checks whether a request to the API is using a legacy HTTP protocol (HTTP/0.9, HTTP/1.0, or HTTP/1.1).
 * Can emit `undefined` if the protocol could not be detected.
 *
 * @param client - The client to use for the request.
 * @returns An Observable that emits `true` for a legacy protocol, `false` for a modern
 * protocol, or `undefined` if the protocol could not be detected.
 * @internal
 */
export function isUsingLegacyHttp(client: SanityClient): Observable<boolean | undefined> {
  return defer(() => {
    let check = legacyHttpChecks.get(client)

    if (!check) {
      check = firstValueFrom(
        getApiNetworkDiagnostic(client).pipe(
          map(({protocol}) => {
            if (protocol === 'unknown') {
              return undefined
            }

            // Typical values are "http/0.9", "http/1.0", "http/1.1", "h2", "h2c", "h3", etc.
            return protocol.startsWith('http/0') || protocol.startsWith('http/1')
          }),
        ),
      )
      legacyHttpChecks.set(client, check)
    }

    return check
  })
}

/**
 * Runs the same ping-based protocol probe as {@link isUsingLegacyHttp}, but returns the
 * full result for diagnostics and support tooling.
 *
 * @internal
 */
export function getApiNetworkDiagnostic(
  client: SanityClient,
  options: ApiNetworkDiagnosticOptions = {},
): Observable<ApiNetworkDiagnostic> {
  if (
    typeof PerformanceObserver === 'undefined' ||
    typeof PerformanceResourceTiming === 'undefined'
  ) {
    return of({
      durationMs: 0,
      protocol: 'unknown',
      status: 'unsupported',
      timedOut: false,
    })
  }

  const checkUrl = `${client.getUrl(checkPath)}?tag=sanity.studio.${checkRequestTag}`
  return defer(() => detectApiNetwork(checkUrl, options.timeout ?? DEFAULT_TIMEOUT))
}

function detectApiNetwork(checkUrl: string, timeoutMs: number): Promise<ApiNetworkDiagnostic> {
  const startedAt = performance.now()
  const abortController = new AbortController()

  return new Promise((resolve) => {
    let responseOk: boolean | undefined
    let responseStatus: number | undefined
    let requestCompleted = false
    let settled = false
    let timingEntry: PerformanceResourceTiming | undefined

    const observer = new PerformanceObserver((list) => {
      const matchingEntry = list
        .getEntries()
        .find(
          (candidate): candidate is PerformanceResourceTiming =>
            candidate instanceof PerformanceResourceTiming &&
            candidate.name === checkUrl &&
            candidate.startTime >= startedAt,
        )
      if (matchingEntry) timingEntry = matchingEntry

      finishSuccess()
    })

    const timer = setTimeout(() => {
      abortController.abort()
      finish({
        durationMs: elapsedSince(startedAt),
        protocol: 'unknown',
        responseOk,
        responseStatus,
        status: 'timeout',
        timedOut: true,
      })
    }, timeoutMs)

    function finish(result: ApiNetworkDiagnostic) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      observer.disconnect()
      resolve(result)
    }

    function finishSuccess() {
      if (!requestCompleted || !timingEntry) return
      finish({
        durationMs: elapsedSince(startedAt),
        protocol: getDebugProtocol() ?? (timingEntry.nextHopProtocol || 'unknown'),
        resourceTiming: toResourceTiming(timingEntry),
        responseOk,
        responseStatus,
        status: 'success',
        timedOut: false,
      })
    }

    observer.observe({type: 'resource', buffered: true})

    fetch(checkUrl, {signal: abortController.signal})
      .then(async (response) => {
        responseOk = response.ok
        responseStatus = response.status
        // An unconsumed body can keep the HTTP stream open and skew subsequent diagnostics.
        // Consume the tiny ping response instead of cancelling it so browser tools report success.
        await response.arrayBuffer()
        requestCompleted = true
        finishSuccess()
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) return
        console.warn('[sanity] Could not detect network protocol:', error)
        finish({
          durationMs: elapsedSince(startedAt),
          error: formatError(error),
          protocol: 'unknown',
          status: 'error',
          timedOut: false,
        })
      })
  })
}

function toResourceTiming(entry: PerformanceResourceTiming): ApiNetworkResourceTiming {
  return {
    connectionMs: durationBetween(entry.connectStart, entry.connectEnd),
    decodedBodySizeBytes: entry.decodedBodySize,
    dnsMs: durationBetween(entry.domainLookupStart, entry.domainLookupEnd),
    durationMs: round(entry.duration),
    encodedBodySizeBytes: entry.encodedBodySize,
    initiatorType: entry.initiatorType,
    redirectMs: durationBetween(entry.redirectStart, entry.redirectEnd),
    requestToFirstByteMs: durationBetween(entry.requestStart, entry.responseStart),
    responseTransferMs: durationBetween(entry.responseStart, entry.responseEnd),
    secureConnectionMs:
      entry.secureConnectionStart > 0
        ? durationBetween(entry.secureConnectionStart, entry.connectEnd)
        : 0,
    serverTiming: (entry.serverTiming ?? []).map(({description, duration, name}) => ({
      description,
      durationMs: round(duration),
      name,
    })),
    startTimeMs: round(entry.startTime),
    transferSizeBytes: entry.transferSize,
  }
}

function durationBetween(start: number, end: number): number {
  return start > 0 && end >= start ? round(end - start) : 0
}

function elapsedSince(start: number): number {
  return round(performance.now() - start)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function getDebugProtocol(): string | undefined {
  try {
    return localStorage.getItem('_sanity_debugProtocol') ?? undefined
  } catch {
    return undefined
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}
