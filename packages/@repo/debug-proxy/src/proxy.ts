import type * as http from 'node:http'
import {type IncomingHttpHeaders, type OutgoingHttpHeaders} from 'node:http'
import type * as http2 from 'node:http2'
import {Http2ServerResponse} from 'node:http2'
import * as https from 'node:https'

import {createParser, type EventSourceMessage} from 'eventsource-parser'
import {
  catchError,
  EMPTY,
  filter,
  fromEvent,
  map,
  mergeMap,
  type MonoTypeOperatorFunction,
  Observable,
  type OperatorFunction,
  pipe,
  share,
  type Subscription,
  take,
  takeUntil,
  tap,
} from 'rxjs'

export type Comment = {type: 'comment'; comment: string}
export type Message = {type: 'message'; message: EventSourceMessage}
/** A server-sent reconnection interval (`retry:` field), in milliseconds. */
export type Retry = {type: 'retry'; retry: number}

export type SSEEvent = Comment | Message | Retry

/**
 * Incoming request/response pair as seen by the proxy. The TLS listener is an
 * `http2.Http2SecureServer` with `allowHTTP1`, so handlers receive either the
 * plain http types or the http2 compat types depending on the negotiated
 * protocol.
 */
export type ProxyRequest = http.IncomingMessage | http2.Http2ServerRequest
export type ProxyResponse = http.ServerResponse | http2.Http2ServerResponse

/** The resolved upstream destination for a proxied request. */
export interface ProxyTarget {
  /** Fully resolved upstream URL (origin + path) for this request. */
  url: URL
  /** Extra headers to set on the upstream request (e.g. Authorization). */
  headers?: Record<string, string> | undefined
  /**
   * Skip TLS certificate verification for this upstream (default false).
   * Set via {@link DebugProxyConfig.insecureUpstream} so every handler —
   * including custom routes — inherits it.
   */
  insecure?: boolean | undefined
}

export interface ProxyHeaders {
  req: {
    url: string
    method: string
    version: string
  }
  statusCode: number
  headers?: OutgoingHttpHeaders | undefined
  statusText?: string | undefined
}

type UpstreamEvent = {type: 'headers'; headers: ProxyHeaders} | {type: 'chunk'; chunk: Buffer}

/**
 * Headers that are connection-specific and must not be forwarded in either
 * direction — they are invalid in HTTP/2 responses and meaningless once the
 * proxy re-frames the message.
 */
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'http2-settings',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'trailers',
  'transfer-encoding',
  'upgrade',
])

function buildUpstreamHeaders(
  req: ProxyRequest,
  target: ProxyTarget,
  transformsBody: boolean,
): OutgoingHttpHeaders {
  const headers: OutgoingHttpHeaders = {}
  for (const [name, value] of Object.entries(req.headers)) {
    // Skip HTTP/2 pseudo-headers (:authority, :path, …) and hop-by-hop headers
    if (name.startsWith(':') || HOP_BY_HOP_HEADERS.has(name) || value === undefined) {
      continue
    }
    headers[name] = value
  }
  headers.host = target.url.host
  // When the body is transformed we operate on raw response bytes, so we must
  // not let upstream compress them (we'd otherwise feed gzip to the SSE parser,
  // or re-send a rewritten body under a now-wrong content-encoding).
  if (transformsBody) {
    headers['accept-encoding'] = 'identity'
  }
  for (const [name, value] of Object.entries(target.headers ?? {})) {
    headers[name.toLowerCase()] = value
  }
  return headers
}

function sanitizeResponseHeaders(
  headers: IncomingHttpHeaders,
  transformsBody: boolean,
): OutgoingHttpHeaders {
  const out: OutgoingHttpHeaders = {}
  for (const [name, value] of Object.entries(headers)) {
    if (HOP_BY_HOP_HEADERS.has(name) || value === undefined) {
      continue
    }
    // A body transform changes the payload, so the upstream's content-length
    // and content-encoding no longer describe what we send.
    if (transformsBody && (name === 'content-length' || name === 'content-encoding')) {
      continue
    }
    out[name] = value
  }
  return out
}

/**
 * Bridge a single upstream request into the reactive world: emits one
 * `headers` event followed by `chunk` events for each piece of the response
 * body, completing when the upstream response ends. Unsubscribing destroys
 * the upstream request.
 *
 * The upstream hop is always HTTP/1.1 over TLS — what matters for debugging
 * is the protocol between the browser and the proxy, which is determined by
 * the listener (see {@link createDebugProxy}).
 */
function upstreamEvents(
  req: ProxyRequest,
  target: ProxyTarget,
  transformsBody: boolean,
): Observable<UpstreamEvent> {
  return new Observable<UpstreamEvent>((observer) => {
    const upstreamReq = https.request(target.url, {
      method: req.method,
      headers: buildUpstreamHeaders(req, target, transformsBody),
      // Verify the upstream cert by default; only skip it when explicitly
      // opted in, since we attach the API token to every request.
      rejectUnauthorized: !target.insecure,
    })
    upstreamReq.on('response', (upstreamRes) => {
      observer.next({
        type: 'headers',
        headers: {
          req: {
            url: req.url ?? '',
            method: req.method ?? 'GET',
            version: req.httpVersion,
          },
          statusCode: upstreamRes.statusCode ?? 200,
          statusText: upstreamRes.statusMessage,
          headers: sanitizeResponseHeaders(upstreamRes.headers, transformsBody),
        },
      })
      upstreamRes.on('data', (chunk: Buffer) => observer.next({type: 'chunk', chunk}))
      upstreamRes.on('end', () => observer.complete())
      // A premature 'close' (upstream connection dropped before 'end') would
      // otherwise hang the client forever. 'close' always fires after 'end',
      // where complete() is a no-op, so this is safe.
      upstreamRes.on('close', () => observer.complete())
      upstreamRes.on('error', (error) => observer.error(error))
    })
    upstreamReq.on('error', (error) => observer.error(error))
    // Forward the request body (mutations, uploads, …)
    req.pipe(upstreamReq)
    return () => {
      upstreamReq.destroy()
    }
  })
}

/**
 * Write the response head, dispatching between the http1 and http2 compat
 * APIs (HTTP/2 has no status message, and the overloads differ enough that
 * TypeScript can't call them through the union).
 */
export function writeResponseHead(
  res: ProxyResponse,
  statusCode: number,
  statusText: string | undefined,
  headers: OutgoingHttpHeaders,
): void {
  if (res instanceof Http2ServerResponse) {
    res.writeHead(statusCode, headers)
  } else {
    res.writeHead(statusCode, statusText, headers)
  }
}

function writeChunk(res: ProxyResponse, chunk: Buffer | string): void {
  // A delayed chunk (e.g. from a latency scenario) can arrive after the client
  // has gone away, in the gap before the 'close' teardown fires — don't write
  // to a dead response. The http2 compat response doesn't expose `destroyed`;
  // the underlying stream is the reliable signal there.
  if (res instanceof Http2ServerResponse) {
    if (!res.stream.destroyed && !res.writableEnded) {
      res.write(chunk)
    }
  } else if (!res.destroyed && !res.writableEnded) {
    res.write(chunk)
  }
}

function respondBadGateway(res: ProxyResponse, error: unknown) {
  console.error('[debug-proxy] upstream error:', error)
  if (res.headersSent) {
    // Mid-stream failure: tear the connection down so the client sees a real
    // broken connection rather than a clean end with a "Bad gateway" suffix.
    res.destroy()
    return
  }
  writeResponseHead(res, 502, undefined, {'content-type': 'text/plain'})
  res.end('Bad gateway')
}

export function createSSEProxy(operator?: MonoTypeOperatorFunction<SSEEvent>) {
  return createRequestProxy({
    // Don't run non-SSE payloads (e.g. a JSON error response from the listen
    // endpoint) through the SSE parser — they'd be silently swallowed.
    transformBodyWhen: (headers) =>
      String(headers.headers?.['content-type'] ?? '').includes('text/event-stream'),
    transformBody: pipe(
      parseSSEEvents(),
      operator || tap(),
      map((msg) => serializeSSEEvent(msg)),
    ),
  })
}

function parseSSEEvents() {
  return (input$: Observable<Buffer>) =>
    new Observable<SSEEvent>((observer) => {
      // A streaming decoder so multi-byte UTF-8 sequences split across chunk
      // boundaries aren't corrupted (Buffer.toString() would mangle them).
      const decoder = new TextDecoder()
      const parser = createParser({
        onEvent: (message) => observer.next({type: 'message', message}),
        onRetry: (retry) => observer.next({type: 'retry', retry}),
        onComment: (comment) => {
          observer.next({type: 'comment', comment: comment})
        },
      })
      return input$.subscribe({
        next: (chunk) => parser.feed(decoder.decode(chunk, {stream: true})),
        error: (error) => observer.error(error),
        complete: () => {
          // Flush any partial multi-byte sequence buffered at stream end
          const rest = decoder.decode()
          if (rest) {
            parser.feed(rest)
          }
          observer.complete()
        },
      })
    })
}

function serializeSSEEvent(event: SSEEvent): string {
  if (event.type === 'comment') {
    return `:${event.comment}\n`
  }
  if (event.type === 'retry') {
    // Server-controlled reconnect interval — passed through since reconnect
    // behavior is exactly what this tool exercises.
    return `retry: ${event.retry}\n\n`
  }
  return serializeSSEMessage(event.message)
}

function serializeSSEMessage(message: EventSourceMessage) {
  let output = ''

  if (message.event) {
    output += `event: ${message.event}\n`
  }

  if (message.id) {
    output += `id: ${message.id}\n`
  }

  // data needs to be present – can be an empty object
  const lines = (message.data ?? '').split('\n')
  for (const line of lines) {
    output += `data: ${line}\n`
  }

  output += '\n'
  return output
}

export function createRequestProxy({
  transformBody,
  transformBodyWhen,
  transformHeaders,
}: {
  transformBody?: OperatorFunction<Buffer, Buffer | string>
  /**
   * Only apply `transformBody` when this predicate returns true for the
   * (possibly transformed) response head. Defaults to always. Note that the
   * upstream content-length/encoding headers are stripped whenever
   * `transformBody` is set, regardless of this predicate.
   */
  transformBodyWhen?: (headers: ProxyHeaders) => boolean
  /**
   * Transform the response head before it is written. Must be synchronous —
   * body chunks start flowing as soon as the head is written.
   */
  transformHeaders?: MonoTypeOperatorFunction<ProxyHeaders>
} = {}) {
  return (req: ProxyRequest, res: ProxyResponse, target: ProxyTarget): Subscription => {
    // Writing to a dead client surfaces as an 'error' on `res`; without a
    // listener that would crash the process. writeChunk also guards, but this
    // covers writes from elsewhere (e.g. res.end()).
    res.on('error', (error) => console.error('[debug-proxy] response error:', error))

    const events$ = upstreamEvents(req, target, Boolean(transformBody)).pipe(share())

    const chunks$ = events$.pipe(
      filter((event): event is Extract<UpstreamEvent, {type: 'chunk'}> => {
        return event.type === 'chunk'
      }),
      map((event) => event.chunk),
    )

    return events$
      .pipe(
        filter((event): event is Extract<UpstreamEvent, {type: 'headers'}> => {
          return event.type === 'headers'
        }),
        map((event) => event.headers),
        transformHeaders || tap(),
        take(1),
        tap((headers) => {
          writeResponseHead(res, headers.statusCode, headers.statusText, headers.headers ?? {})
        }),
        // The body subscription starts only once the head has been written,
        // so a body chunk can never sneak out ahead of writeHead.
        mergeMap((headers) =>
          transformBody && (transformBodyWhen?.(headers) ?? true)
            ? chunks$.pipe(transformBody)
            : chunks$,
        ),
        tap((chunk) => writeChunk(res, chunk)),
        tap({complete: () => res.end()}),
        catchError((error) => {
          respondBadGateway(res, error)
          return EMPTY
        }),
        takeUntil(fromEvent(res, 'close')),
      )
      .subscribe()
  }
}
