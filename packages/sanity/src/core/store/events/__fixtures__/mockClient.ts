import {type SanityClient} from '@sanity/client'
import {isObservable, type Observable, of, throwError} from 'rxjs'

export interface RecordedRequest {
  url: string
  tag?: string
}

export interface MockClientOptions {
  dataset?: string
  projectId?: string
  token?: string
  /**
   * Routes `client.observable.request` calls. Return the response body (emitted through `of`),
   * or an Observable for custom timing, or throw to simulate a request error.
   */
  respond?: (request: RecordedRequest) => unknown
}

export interface MockClient {
  client: SanityClient
  /** Every `observable.request` call, in order. Useful to assert URLs, tags and request counts. */
  requests: RecordedRequest[]
}

/**
 * Minimal `SanityClient` stub covering the surface the events store uses:
 * `config()`, `getUrl()` and `observable.request()`. Translog calls go through the global
 * `fetch` instead — stub that with {@link createTranslogFetchStub}.
 */
export function createMockClient(options: MockClientOptions = {}): MockClient {
  const {
    dataset = 'test-dataset',
    projectId = 'test-project',
    token = 'mock-token',
    respond,
  } = options
  const requests: RecordedRequest[] = []

  const client = {
    config: () => ({dataset, projectId, token}),
    getUrl: (uri: string) => `https://${projectId}.api.sanity.test/v1${uri}`,
    observable: {
      request: (request: RecordedRequest): Observable<unknown> => {
        requests.push(request)
        if (!respond) {
          return throwError(() => new Error(`Unexpected request: ${request.url}`))
        }
        let response: unknown
        try {
          response = respond(request)
        } catch (error) {
          return throwError(() => error)
        }
        return isObservable(response) ? response : of(response)
      },
    },
  }

  return {client: client as unknown as SanityClient, requests}
}

/**
 * Builds a `fetch` replacement that serves NDJSON translog responses, for code paths going
 * through `getJsonStream`/`getTransactionsLogs`. Register it with
 * `vi.stubGlobal('fetch', stub.fetch)` and route per-URL through `respond`.
 */
export function createTranslogFetchStub(
  respond: (url: string) => unknown[] | {error: {description?: string; type: string}},
): {fetch: typeof fetch; calls: string[]} {
  const calls: string[] = []
  const fetchStub = (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    calls.push(url)
    const result = respond(url)
    const entries = Array.isArray(result) ? result : [result]
    const body = entries.map((entry) => JSON.stringify(entry)).join('\n')
    return Promise.resolve(new Response(body, {headers: {'content-type': 'application/x-ndjson'}}))
  }
  return {fetch: fetchStub as typeof fetch, calls}
}
