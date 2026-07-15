import {getIt, type RequestOptions} from 'get-it'
import {base, httpErrors, jsonRequest, jsonResponse, promise, retry} from 'get-it/middleware'

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
 * `<B>(options): Promise<B>` — such as a configured `get-it` instance — is
 * structurally assignable, so callers can bring their own transport.
 *
 * @internal
 */
export type DescriptorRequester = <T>(options: DescriptorRequestOptions) => Promise<T>

/**
 * Retry on rate-limit (429) and server (5xx) responses.
 *
 * @internal
 */
export function defaultShouldRetry(err: unknown): boolean {
  const statusCode = (err as {response?: {statusCode?: number}} | undefined)?.response?.statusCode
  return statusCode === 429 || (typeof statusCode === 'number' && statusCode >= 500)
}

/**
 * @internal
 */
export interface GetItRequesterOptions {
  baseUrl: string
}

/**
 * Build the default get-it requester. Auth and headers are NOT applied here —
 * `uploadSchema`'s `request` helper merges them into each request's `headers` so
 * the same path serves both this transport and a caller-injected requester.
 *
 * @internal
 */
export function createGetItRequester(options: GetItRequesterOptions): DescriptorRequester {
  const requester = getIt([
    base(options.baseUrl),
    jsonResponse(),
    jsonRequest(),
    httpErrors(),
    retry({shouldRetry: defaultShouldRetry}),
    promise({onlyBody: true}),
  ])
  return <T>(opts: DescriptorRequestOptions) => requester(opts) as Promise<T>
}
