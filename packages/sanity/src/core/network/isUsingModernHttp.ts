import {type SanityClient} from '@sanity/client'
import {from, Observable, of, race, timer} from 'rxjs'
import {map, take} from 'rxjs/operators'

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
 * Preferably we want to use a client, since that will have both a configured URL (the
 * user may have configured a custom API URL) and also uses the client for _requesting_
 * the URL. While this last part _shouldn't_ make a difference, there is a theoretical
 * possibility that XMLHttpRequest (potentially used by the client) uses a different
 * protocol than the fetch API.
 */
const fallbackApiUrl = `https://api.sanity.io/v2025-03-01/ping?tag=sanity.studio.${checkRequestTag}`

/**
 * Checks whether a request to the API is using a modern HTTP protocol (HTTP/2 or later).
 * Can emit `undefined` if the protocol could not be detected.
 *
 * @param client - The client to use for the request. If not provided, a fetch request
 * will be made to the fallback API URL. Prefer using a client, as it will have the
 * correct URL configured.
 * @returns An Observable that emits `true` if the API request is using a modern HTTP
 * protocol, `false` if it is not, or `undefined` if it could not be detected.
 * @public
 */
export function isUsingModernHttp(client?: SanityClient): Observable<boolean | undefined> {
  return getProtocolForApi(client).pipe(
    map((protocol) => {
      if (!protocol) {
        return undefined
      }

      // Typical values for protocol are "http/0.9", "http/1.0", "http/1.1", "h2", "h2c", "h3", etc.
      // We consider anything `http/0*` or `http/1*` to be non-modern.
      return !protocol.startsWith('http/0') && !protocol.startsWith('http/1')
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
function getProtocolForApi(client?: SanityClient): Observable<string | undefined> {
  if (
    typeof PerformanceObserver === 'undefined' ||
    typeof PerformanceResourceTiming === 'undefined'
  ) {
    // If we don't have the necessary APIs, we can't do the check
    return of(undefined)
  }

  const checkUrl = client ? client.getUrl(checkPath) : `${fallbackApiUrl}${checkPath}`

  // Race the actual timing detection against a 2.5s timer.
  // If the timer wins, we emit undefined to indicate we couldn’t detect the protocol.
  return race(detectProtocol(checkUrl, client), timer(2500).pipe(map(() => undefined))).pipe(
    take(1),
  )
}

/**
 * Creates an Observable that sets up a PerformanceObserver, issues the network request,
 * and emits the `nextHopProtocol` once the resource timing shows up. If the request
 * fails, the Observable will emit an error.
 *
 * @internal
 */
function detectProtocol(checkUrl: string, client?: SanityClient): Observable<string | undefined> {
  return new Observable<string | undefined>((subscriber) => {
    const observer = new PerformanceObserver((list, obs) => {
      for (const entry of list.getEntries()) {
        if (
          !(entry instanceof PerformanceResourceTiming) ||
          !entry.name.includes(checkRequestTag) ||
          !entry.name.includes(checkPath)
        ) {
          return
        }

        obs.disconnect()
        subscriber.next(entry.nextHopProtocol)
        subscriber.complete()
      }
    })

    observer.observe({
      type: 'resource',
      buffered: true,
    })

    const request$ = client
      ? client.observable.request({uri: checkPath, withCredentials: false, tag: checkRequestTag})
      : from(fetch(checkUrl))

    const requestSub = request$.subscribe({
      error: (err) => {
        observer.disconnect()
        subscriber.error(err)
      },
    })

    return () => {
      requestSub.unsubscribe()
      observer.disconnect()
    }
  })
}
