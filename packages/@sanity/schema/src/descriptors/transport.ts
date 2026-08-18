import {
  type BufferedResponse,
  createRequester,
  type FetchFunction,
  HttpError,
  type RequestOptions,
} from 'get-it'
import {retry} from 'get-it/middleware'

/**
 * Headers applied to each request.
 *
 * @internal
 */
export type RequestHeaders = Record<string, string>

/**
 * Request shape the client passes to the transport. Aliases get-it's
 * `RequestOptions` so the bundled requester and any caller-injected one share a
 * single contract; the client itself only ever sets `url`, `method`, `body`,
 * and `headers`.
 *
 * @internal
 */
export type DescriptorRequestOptions = RequestOptions

/**
 * The transport seam. The client calls this for every request; the return value
 * is the parsed response body. Any requester with the shape
 * `<B>(options): Promise<B>` is structurally assignable, so callers can bring
 * their own transport. Note that a configured get-it v9 instance does NOT
 * qualify on its own — it resolves with the full response object, not the
 * parsed body — so it must be wrapped the way {@link createGetItRequester}
 * wraps it.
 *
 * @internal
 */
export type DescriptorRequester = <T>(options: DescriptorRequestOptions) => Promise<T>

/**
 * Retry on rate-limit (429) and server (5xx) responses. get-it v9 throws a
 * `HttpError` (with the status on `err.status`) for non-2xx responses; network
 * and timeout failures are not `HttpError`s and are not retried, matching the
 * v8 behavior of reading `err.response.statusCode`.
 *
 * @internal
 */
export function defaultShouldRetry(err: unknown): boolean {
  if (!(err instanceof HttpError)) return false
  return err.status === 429 || err.status >= 500
}

/**
 * @internal
 */
export interface GetItRequesterOptions {
  baseUrl: string
  /**
   * Injectable fetch, forwarded to get-it. Tests pass `createMockFetch().fetch`;
   * callers can supply a custom transport the same way.
   */
  fetch?: FetchFunction
}

/**
 * Parse a response body the way get-it v8's `jsonResponse()` middleware did:
 * JSON only when the body is non-empty and the content type says so, the raw
 * text otherwise, `undefined` for empty bodies. get-it v9's `as: 'json'`
 * parses unconditionally and throws on empty bodies, which an endpoint
 * answering e.g. `204 No Content` would trip on.
 */
function parseBody(res: BufferedResponse): unknown {
  const text = res.text()
  if (!text) return undefined
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) return text
  return res.json()
}

/**
 * Build the default get-it requester. Auth and headers are NOT applied here —
 * `uploadSchema`'s `request` helper merges them into each request's `headers` so
 * the same path serves both this transport and a caller-injected requester.
 *
 * @internal
 */
export function createGetItRequester(options: GetItRequesterOptions): DescriptorRequester {
  const requester = createRequester({
    base: options.baseUrl,
    // v8's `jsonResponse()` middleware sent `Accept: application/json` on every
    // request; v9 sets no Accept header by itself, so restore it here.
    // Per-request headers merge over (and can override) this default.
    headers: {Accept: 'application/json'},
    fetch: options.fetch,
    // JSON request serialization and HTTP-error throwing are built into v9
    // (and on by default); only the retry policy needs middleware.
    middleware: [retry({shouldRetry: defaultShouldRetry})],
  })
  return async <T>(opts: DescriptorRequestOptions): Promise<T> => {
    // v8 resolved with the body only (`promise({onlyBody: true})`); v9 always
    // resolves with the full response, so unwrap the (parsed) body here.
    const res = await requester(opts)
    return parseBody(res) as T
  }
}
