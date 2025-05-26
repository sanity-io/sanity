import {type SanityClient} from '@sanity/client'
import {defer, firstValueFrom, Observable, of, take, timeout} from 'rxjs'
import {filter, map, mergeMap} from 'rxjs/operators'

/**
 * The /ping route is special in that it allows any origin to access it, and crucially
 * for this case: also allows _timing_ requests through the `timing-allow-origin` header.
 * This is what allows us to detect the protocol used for the request by using the
 * browser Performance API.
 */
const checkPath = '/ping'

/**
 * The tag to use for the request to the /ping route. This is used to identify the
 * request in the Performance API as well as in the server logs.
 */
const checkRequestTag = 'protocol-check'

/**
 * Checks whether a request to the API is using a legacy HTTP protocol (HTTP/0.9, HTTP/1.0, or HTTP/1.1).
 * Can emit `undefined` if the protocol could not be detected.
 *
 * @param client - The client to use for the request. If not provided, a fetch request
 * will be made to the fallback API URL. Prefer using a client, as it will have the
 * correct URL configured.
 * @returns An Observable that emits `true` if the API request is using a legacy HTTP
 * protocol, `false` if it is not, or `undefined` if protocol could not be detected.
 * @internal
 */
export function isUsingLegacyHttp(client: SanityClient): Observable<boolean | undefined> {
  return getProtocolForApi(client).pipe(
    map((protocol) => {
      if (!protocol) {
        return undefined
      }

      // Typical values for protocol are "http/0.9", "http/1.0", "http/1.1", "h2", "h2c", "h3", etc.
      // We consider anything `http/0*` or `http/1*` to be non-modern.
      return protocol.startsWith('http/0') || protocol.startsWith('http/1')
    }),
  )
}

/**
 * Detects the protocol used for the API request by using the browser Performance API.
 * This is useful for detecting whether the API request is using HTTP/2 or not.
 *
 * @param client - The client to use for the request. If not provided, a fetch request
 * will be made to the fallback API URL. Prefer using a client, as it will have the
 * correct URL configured.
 * @returns An Observable that emits the protocol used for the API request, or `undefined`
 * if it could not be detected.
 * @internal
 */
function getProtocolForApi(client: SanityClient): Observable<string | undefined> {
  if (
    typeof PerformanceObserver === 'undefined' ||
    typeof PerformanceResourceTiming === 'undefined'
  ) {
    // If we don't have the necessary APIs, we can't do the check
    return of(undefined)
  }

  return detectProtocol(`${client.getUrl(checkPath)}?tag=sanity.studio.${checkRequestTag}`)
}

/**
 * Creates an Observable that sets up a PerformanceObserver, issues the network request,
 * and emits the `nextHopProtocol` once the resource timing shows up. If the request
 * fails, the Observable will emit an error.
 *
 * @internal
 */
function detectProtocol(checkUrl: string): Observable<string | undefined> {
  const timingEntry = firstValueFrom(
    listenBufferedPerformanceEntries().pipe(
      filter(
        (entry): entry is PerformanceResourceTiming =>
          entry instanceof PerformanceResourceTiming && entry.name === checkUrl,
      ),
      take(1),
      map((entry) => localStorage._sanity_debugProtocol ?? entry.nextHopProtocol),
    ),
  )

  return defer(() => fetch(checkUrl)).pipe(
    // when the request is over, we map it to the corresponding timing entry
    mergeMap(() => timingEntry),
    // Race the actual timing detection against a 2.5s timer.
    // If the timer wins, we emit undefined to indicate we couldn’t detect the protocol.
    timeout({first: 2500, with: () => of(undefined)}),
  )
}

function listenBufferedPerformanceEntries() {
  return new Observable<PerformanceEntry>((subscriber) => {
    const perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        subscriber.next(entry)
      }
    })
    perfObserver.observe({
      type: 'resource',
      buffered: true,
    })
    return () => perfObserver.disconnect()
  })
}
