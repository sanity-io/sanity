import {type SanityClient} from '@sanity/client'

/**
 * Checks if the client supports a more modern HTTP protocol than HTTP1.
 *
 * @param client - The client to use for checking HTTP protocol support.
 * @returns Boolean that resolves to `true` if HTTP2 or newer is supported, `false` if _unsupported_, and `undefined` if _unknown_ (eg browser does not have the necessary APIs to determine).
 * @internal
 */
export async function supportsModernHttp(client: SanityClient): Promise<boolean | undefined> {
  try {
    const pingEntry = await getPingResourceTimingEntry(client)

    if (
      pingEntry &&
      'nextHopProtocol' in pingEntry &&
      typeof pingEntry.nextHopProtocol === 'string'
    ) {
      // `nextHopProtocol` is a string representing the network protocol used to fetch the resource,
      // as identified by the ALPN Protocol ID(RFC7301). < HTTP2 uses eg "http/1.1", while > HTTP2
      // uses eg "h2", "h2c" (HTTP/2 over cleartext TCP), "h3" (HTTP/3) etc.
      // As we only care about "more modern than HTTP1", we'll just check for "h<digit>" prefix here.
      return /^h\d/.test(pingEntry.nextHopProtocol)
    }

    return undefined
  } catch (err) {
    return false
  }
}

/**
 * Perform a request against the `/ping` endpoint, and get a `PerformanceEntry` for it.
 * This endpoint allows more timing information to be exposed to browsers, which can tell us things
 * such as which HTTP protocol was used, how long it took to resolve DNS, connect, initiate TLS etc.
 *
 * @param client - The client to use for the request
 * @returns A `PerformanceEntry` for the `/ping` request, or `undefined` if the request failed or timed out.
 * @internal
 */
async function getPingResourceTimingEntry(
  client: SanityClient,
): Promise<PerformanceEntry | undefined> {
  if (typeof PerformanceObserver === 'undefined') {
    return undefined
  }

  const tag = 'ping-for-protocol'
  return new Promise((resolve) => {
    // Try to get resource timing entry for /ping request (allows browser to read network timings)
    // If we can't get it within a reasonable time, we'll resolve with `undefined` ("timeout")
    let resolved = false
    const observer = new PerformanceObserver(function perfObserver(list, obs) {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('/ping') && entry.name.includes(tag) && !resolved) {
          resolve(entry)
          resolved = true
          obs.disconnect()
        }
      })
    })
    observer.observe({type: 'resource'})

    client
      .request({
        uri: '/ping',
        withCredentials: false,
        tag,
      })
      .catch(() => undefined)
      // If after 150ms we haven't gotten a timing entry, we'll resolve with `undefined` ("timeout")
      .then(() => new Promise((waited) => setTimeout(waited, 150)))
      .then(() => {
        if (!resolved) {
          resolved = true
          observer.disconnect()
          resolve(undefined)
        }
      })
  })
}
