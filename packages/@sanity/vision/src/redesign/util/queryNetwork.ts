import {
  type RawQueryResponse,
  type RequestHandler,
  type SanityClient,
  type UnfilteredResponseQueryOptions,
} from '@sanity/client'

import {isApiCdnHost} from '../../util/parseQueryUrl'
import {type QueryRequestMethod} from '../../util/queryRequestMethod'

/**
 * How a query's response travelled, from the headers the API exposes to browsers
 * (`Access-Control-Expose-Headers`: `X-Sanity-Shard`, `traceparent`, plus the safelisted
 * `Cache-Control`). `X-Sanity-Age` and `Server-Timing` are not among them.
 */
export interface QueryNetwork {
  /**
   * How the client sent the query: `GET` with the query and params in the URL, or `POST` with
   * them as a JSON body once they are too long for a URL (`queryRequestMethod`)
   */
  method: QueryRequestMethod | undefined
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
  /**
   * Set when groq-store-wasm's service worker answered from the copy of the dataset it keeps on
   * this device (`X-Groq-Wasm: hit`) rather than letting the request through to the API
   */
  local?: LocalAnswer
}

/** One `Server-Timing` entry: `wasm;dur=1.84;desc="Query in WebAssembly"` */
export interface ServerTiming {
  name: string
  /** Milliseconds */
  dur?: number
  desc?: string
}

/**
 * What groq-store-wasm says about an answer it gave on this device. Every part is optional:
 * `X-Groq-Wasm-Documents`, `X-Groq-Wasm-Memory` and `Server-Timing` came after `X-Groq-Wasm`.
 */
export interface LocalAnswer {
  /** Documents in the store that answered */
  documents?: number
  /** Bytes of that store's WebAssembly linear memory */
  memoryBytes?: number
  /**
   * The store's timings, in the order to show them: `wasm`, the parts of it (`parse`, `execute`,
   * `serialize`) and `route`. Other names are ignored.
   */
  timings: ServerTiming[]
}

/** The `Server-Timing` names groq-store-wasm sends; `parse`, `execute` and `serialize` are parts of `wasm` */
export const LOCAL_TIMING_NAMES = ['wasm', 'parse', 'execute', 'serialize', 'route'] as const
export const LOCAL_TIMING_PARTS: ReadonlySet<string> = new Set(['parse', 'execute', 'serialize'])

/** Splits on `separator` where it is not inside a quoted string */
function splitOutsideQuotes(value: string, separator: string): string[] {
  const parts: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < value.length; index++) {
    const char = value[index]
    if (quoted && char === '\\' && index + 1 < value.length) {
      current += char + value[++index]
      continue
    }
    if (char === '"') quoted = !quoted
    if (char === separator && !quoted) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  parts.push(current)
  return parts
}

function unquote(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\(.)/g, '$1')
  }
  return trimmed
}

const TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

/**
 * Reads a `Server-Timing` header (https://w3c.github.io/server-timing/). Tolerant: an entry
 * without a valid name is skipped, a `dur` that is not a number is left out, and of repeated
 * params the first counts.
 */
export function parseServerTiming(header: string | null | undefined): ServerTiming[] {
  if (!header) return []
  const timings: ServerTiming[] = []
  for (const entry of splitOutsideQuotes(header, ',')) {
    const [rawName = '', ...params] = splitOutsideQuotes(entry, ';')
    const name = rawName.trim()
    if (!TOKEN.test(name)) continue
    const timing: ServerTiming = {name}
    for (const param of params) {
      const equals = param.indexOf('=')
      const key = (equals === -1 ? param : param.slice(0, equals)).trim().toLowerCase()
      const value = equals === -1 ? '' : unquote(param.slice(equals + 1))
      if (key === 'dur' && timing.dur === undefined) {
        const dur = Number(value)
        if (value !== '' && Number.isFinite(dur)) timing.dur = dur
      } else if (key === 'desc' && timing.desc === undefined) {
        timing.desc = value
      }
    }
    timings.push(timing)
  }
  return timings
}

function count(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const number = Number(value.trim())
  return Number.isFinite(number) && number >= 0 ? number : undefined
}

/** groq-store-wasm's account of an answer it gave, when it gave it */
export function readLocalAnswer(headers: Headers): LocalAnswer | undefined {
  if (headers.get('x-groq-wasm')?.trim().toLowerCase() !== 'hit') return undefined
  const timings = parseServerTiming(headers.get('server-timing'))
  return {
    documents: count(headers.get('x-groq-wasm-documents')),
    memoryBytes: count(headers.get('x-groq-wasm-memory')),
    timings: LOCAL_TIMING_NAMES.flatMap(
      (name) => timings.find((timing) => timing.name === name && timing.dur !== undefined) ?? [],
    ),
  }
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

function methodOf(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): QueryRequestMethod | undefined {
  // `fetch` defaults to GET; the client sets the method either way
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
  return method === 'GET' || method === 'POST' ? method : undefined
}

function readQueryNetwork(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  headers: Headers,
): QueryNetwork {
  const url = urlOf(input)
  let viaCdn = false
  try {
    viaCdn = isApiCdnHost(new URL(url).hostname)
  } catch {
    // A relative URL is the API's
  }
  const local = readLocalAnswer(headers)
  const traceId = headers.get('traceparent')?.split('-')[1] || undefined
  const cacheHit = viaCdn && traceId !== undefined && rememberedTraces.has(traceId)
  if (traceId) remember(traceId)
  return {
    method: methodOf(input, init),
    viaCdn,
    cacheHit,
    shard: headers.get('x-sanity-shard') ?? undefined,
    traceId,
    cacheControl: headers.get('cache-control') ?? undefined,
    ...(local && {local}),
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
        network = readQueryNetwork(input, init, response.headers)
        return response
      },
    }
    return previous ? previous(tapped, next) : next(tapped)
  }
  const response = await client.withConfig({requestHandler}).fetch(query, params, options)
  return {response, network}
}
