import {
  type RawQueryResponse,
  type RequestHandler,
  type SanityClient,
  type UnfilteredResponseQueryOptions,
} from '@sanity/client'

import {isApiCdnHost} from '../../util/parseQueryUrl'

/**
 * How a query's response travelled, from the headers the API exposes to browsers
 * (`Access-Control-Expose-Headers`: `X-Sanity-Shard`, `traceparent`, plus the safelisted
 * `Cache-Control`). `X-Sanity-Age` and `Server-Timing` are not among them.
 */
export interface QueryNetwork {
  /** The API CDN answered rather than the API */
  viaCdn: boolean
  /**
   * The CDN answered from its cache: a cached response repeats the `traceparent` of the one it
   * was cached from, and this session got that one before. An answer the CDN cached for an
   * earlier request this session did not see reads as fresh.
   */
  cacheHit: boolean
  /** Where the query ran: `gcp-eu-w1-01-prod-1028` */
  shard: string | undefined
  /** The trace of the request that produced the response, for Sanity support */
  traceId: string | undefined
  /** `private, max-age=60, stale-while-revalidate=15` from the CDN */
  cacheControl: string | undefined
}

/** Enough to tell this session's cache hits; the oldest traces are forgotten past it */
const MAX_REMEMBERED_TRACES = 500
const rememberedTraces = new Set<string>()

function remember(traceId: string): void {
  rememberedTraces.delete(traceId)
  rememberedTraces.add(traceId)
  if (rememberedTraces.size > MAX_REMEMBERED_TRACES) {
    const [oldest] = rememberedTraces
    rememberedTraces.delete(oldest)
  }
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  return input instanceof URL ? input.href : input.url
}

function readQueryNetwork(url: string, headers: Headers): QueryNetwork {
  let viaCdn = false
  try {
    viaCdn = isApiCdnHost(new URL(url).hostname)
  } catch {
    // A relative URL is the API's
  }
  const traceId = headers.get('traceparent')?.split('-')[1] || undefined
  const cacheHit = viaCdn && traceId !== undefined && rememberedTraces.has(traceId)
  if (traceId) remember(traceId)
  return {
    viaCdn,
    cacheHit,
    shard: headers.get('x-sanity-shard') ?? undefined,
    traceId,
    cacheControl: headers.get('cache-control') ?? undefined,
  }
}

/**
 * `client.fetch` that also reports how the response travelled. The client's own pipeline makes
 * the request (URL, credentials, retries, errors); a request handler only hands its transport a
 * `fetch` that reads the response headers on the way, and asks the browser to revalidate rather
 * than answer from its own cache, so a cached answer is the CDN's. `network` stays `undefined`
 * when the transport did not use it.
 */
export async function fetchWithNetwork(
  client: SanityClient,
  query: string,
  params: Record<string, unknown>,
  options: UnfilteredResponseQueryOptions,
): Promise<{response: RawQueryResponse<unknown>; network: QueryNetwork | undefined}> {
  let network: QueryNetwork | undefined
  const previous = client.config().requestHandler
  const requestHandler: RequestHandler = (request, next) => {
    // `get-it` takes the request's `fetch` over the global one
    const tapped = {
      ...request,
      fetch: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const response = await globalThis.fetch(input, {...init, cache: 'no-cache'})
        network = readQueryNetwork(urlOf(input), response.headers)
        return response
      },
    }
    return previous ? previous(tapped, next) : next(tapped)
  }
  const response = await client.withConfig({requestHandler}).fetch(query, params, options)
  return {response, network}
}
