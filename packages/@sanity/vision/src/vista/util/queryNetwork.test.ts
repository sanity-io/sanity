import {createClient} from '@sanity/client'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  encodedQuerySize,
  QUERY_URL_SIZE_LIMIT,
  queryRequestMethod,
} from '../../util/queryRequestMethod'
import {fetchWithNetwork} from './queryNetwork'

function respond(body: unknown, headers: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'content-type': 'application/json', ...headers},
  })
}

const client = createClient({
  projectId: 'abc123',
  dataset: 'production',
  apiVersion: '2025-02-19',
  useCdn: false,
  token: 'sk-test',
  ignoreBrowserTokenWarning: true,
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchWithNetwork', () => {
  it('runs the query through the client and reads how the response travelled', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      respond(
        {query: '*', result: [1], ms: 3},
        {
          'traceparent': '00-aaaa1111-bbbb-01',
          'x-sanity-shard': 'gcp-eu-w1-01-prod-1028',
          'cache-control': 'private, max-age=60, stale-while-revalidate=15',
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const first = await fetchWithNetwork(
      client,
      '*',
      {},
      {filterResponse: false, useCdn: true, tag: 'vista'},
    )
    expect(first.response).toMatchObject({result: [1], ms: 3})
    expect(first.network).toEqual({
      method: 'GET',
      viaCdn: true,
      cacheHit: false,
      shard: 'gcp-eu-w1-01-prod-1028',
      traceId: 'aaaa1111',
      cacheControl: 'private, max-age=60, stale-while-revalidate=15',
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(
      /^https:\/\/abc123\.apicdn\.sanity\.io\/v2025-02-19\/data\/query\/production\?/,
    )
    expect(String(url)).toContain('tag=vista')
    // The browser revalidates, so a cached answer is the CDN's; the client's credentials stay
    expect(init?.cache).toBe('no-cache')
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer sk-test')

    // The CDN answering from its cache repeats the trace of the response it cached
    const second = await fetchWithNetwork(client, '*', {}, {filterResponse: false, useCdn: true})
    expect(second.network).toMatchObject({viaCdn: true, cacheHit: true, traceId: 'aaaa1111'})
  })

  it('tells the API from the CDN, where no answer is a cache hit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respond({query: '*', result: [], ms: 1}, {traceparent: '00-cccc2222-dddd-01'}),
      ),
    )
    const first = await fetchWithNetwork(client, '*', {}, {filterResponse: false})
    const again = await fetchWithNetwork(client, '*', {}, {filterResponse: false})
    expect(first.network).toMatchObject({viaCdn: false, cacheHit: false, traceId: 'cccc2222'})
    expect(again.network).toMatchObject({viaCdn: false, cacheHit: false})
    expect(first.network?.shard).toBeUndefined()
  })

  it('sends the query as the installed client does at the URL size limit, and reports the method', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      respond({query: '*', result: [], ms: 1}, {traceparent: '00-eeee3333-ffff-01'}),
    )
    vi.stubGlobal('fetch', fetchMock)
    // `*` is not percent-encoded, so `?query=` plus the stars is the string the client measures
    const queryOfEncodedSize = (size: number) => '*'.repeat(size - '?query='.length)
    const under = queryOfEncodedSize(QUERY_URL_SIZE_LIMIT - 1)
    const at = queryOfEncodedSize(QUERY_URL_SIZE_LIMIT)
    expect(encodedQuerySize(under, {})).toBe(11263)
    expect(encodedQuerySize(at, {})).toBe(11264)

    // One short of the limit: GET, query and params in the URL
    const {network: underNetwork} = await fetchWithNetwork(
      client,
      under,
      {},
      {filterResponse: false, tag: 'vista'},
    )
    const [underUrl, underInit] = fetchMock.mock.calls[0]
    expect(underInit?.method).toBe('GET')
    expect(underInit?.body).toBeUndefined()
    expect(new URL(String(underUrl)).searchParams.get('query')).toBe(under)
    expect(underNetwork?.method).toBe('GET')
    expect(queryRequestMethod(under, {})).toBe('GET')

    // At the limit: POST, `{query, params}` as a JSON body, only the options left in the URL
    const {network: atNetwork} = await fetchWithNetwork(
      client,
      at,
      {id: 1},
      {filterResponse: false, perspective: 'published', tag: 'vista'},
    )
    const [atUrl, atInit] = fetchMock.mock.calls[1]
    expect(atInit?.method).toBe('POST')
    expect(JSON.parse(String(atInit?.body))).toEqual({query: at, params: {id: 1}})
    const atSearchParams = new URL(String(atUrl)).searchParams
    expect(atSearchParams.has('query')).toBe(false)
    expect(atSearchParams.has('$id')).toBe(false)
    expect(atSearchParams.get('perspective')).toBe('published')
    expect(atSearchParams.get('tag')).toBe('vista')
    expect(atNetwork?.method).toBe('POST')
    expect(queryRequestMethod(at, {id: 1})).toBe('POST')
  })

  it('rejects with the client’s own errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respond(
          {
            error: {
              type: 'queryParseError',
              description: 'unexpected token',
              query: '*[',
              start: 1,
              end: 2,
            },
          },
          {},
          400,
        ),
      ),
    )
    await expect(fetchWithNetwork(client, '*[', {}, {filterResponse: false})).rejects.toMatchObject(
      {
        statusCode: 400,
        details: {description: 'unexpected token'},
        message: expect.stringContaining('GROQ query parse error'),
      },
    )
  })
})
