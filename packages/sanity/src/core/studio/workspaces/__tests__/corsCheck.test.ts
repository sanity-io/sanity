import {type ClientConfig, type SanityClient} from '@sanity/client'
import QuickLRU from 'quick-lru'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type CorsCheckCache, checkCors} from '../corsCheck'

type ClientConfigResource = NonNullable<ClientConfig['resource']>

function fakeClient(
  config: {
    projectId?: string
    apiHost?: string
    apiVersion?: string
    url?: string
    resource?: ClientConfigResource
  } = {},
): SanityClient {
  const resolved = {
    projectId: 'abc123',
    apiHost: 'https://api.sanity.io',
    apiVersion: '1',
    url: 'https://abc123.api.sanity.io/v1',
    ...config,
  }
  return {config: () => resolved} as unknown as SanityClient
}

/**
 * A client scoped to a global resource (Media Library, Canvas, cross-project
 * dataset). `@sanity/client` drops the project subdomain as soon as `resource`
 * is set, so `config.url` points at the global host.
 */
function fakeResourceClient(resource: ClientConfigResource): SanityClient {
  return fakeClient({resource, apiVersion: 'X', url: 'https://api.sanity.io/vX'})
}

function makeCache(): CorsCheckCache {
  return new QuickLRU({maxAge: 1000 * 60 * 2, maxSize: 200})
}

/** A `fetch` mock whose response stays pending until `release()` is called. */
function deferredFetch(body: unknown) {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const fetchMock = vi.fn(async () => {
    await gate
    return {
      ok: true,
      json: async () => body,
    } as Response
  })
  return {fetchMock, release}
}

describe('checkCors', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns null without hitting the network when projectId or url is missing', async () => {
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as never
    expect(await checkCors(fakeClient({projectId: undefined}), makeCache())).toBeNull()
    expect(await checkCors(fakeClient({url: undefined}), makeCache())).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('dedupes a burst of concurrent probes into a single fetch', async () => {
    // The whole reason the cache exists: a CORS outage fails every
    // in-flight request at once, each calling checkCors. They must collapse
    // to one /check/cors request, not N.
    const {fetchMock, release} = deferredFetch({
      result: {allowed: false, withCredentials: false},
    })
    globalThis.fetch = fetchMock as never

    const cache = makeCache()
    const client = fakeClient()
    const burst = Array.from({length: 25}, () => checkCors(client, cache))

    // All 25 share the one in-flight promise before it settles.
    expect(fetchMock).toHaveBeenCalledTimes(1)

    release()
    const results = await Promise.all(burst)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    // Every caller gets the same (negative) verdict.
    for (const result of results) {
      expect(result).toEqual({allowed: false, withCredentials: false})
    }
  })

  it('hits /check/cors with a bare credential-less GET at the right url', async () => {
    const fetchMock = vi.fn(
      async () => ({ok: true, json: async () => ({result: {allowed: true}})}) as Response,
    )
    globalThis.fetch = fetchMock as never
    await checkCors(fakeClient({url: 'https://abc123.api.sanity.io/v1/'}), makeCache())
    expect(fetchMock).toHaveBeenCalledWith('https://abc123.api.sanity.io/v1/check/cors', {
      method: 'GET',
      credentials: 'omit',
    })
  })

  it('probes the project host for a resource-scoped client', async () => {
    // A resource-scoped client talks to the global host, which has no project
    // context and so always answers `allowed: false`. Probing it would report
    // a CORS misconfiguration for every studio whose Media Library request
    // fails, and take over the screen with the "register Studio" prompt.
    const fetchMock = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({result: {allowed: true, withCredentials: true}}),
        }) as Response,
    )
    globalThis.fetch = fetchMock as never

    await checkCors(fakeResourceClient({type: 'media-library', id: 'ml123'}), makeCache())

    expect(fetchMock).toHaveBeenCalledWith('https://abc123.api.sanity.io/vX/check/cors', {
      method: 'GET',
      credentials: 'omit',
    })
  })

  it('probes the project host on a custom apiHost, port and all', async () => {
    const fetchMock = vi.fn(
      async () => ({ok: true, json: async () => ({result: {allowed: true}})}) as Response,
    )
    globalThis.fetch = fetchMock as never

    await checkCors(
      fakeClient({
        apiHost: 'http://api.sanity.work:8080',
        apiVersion: '2025-02-19',
        resource: {type: 'canvas', id: 'cnv123'},
        url: 'http://api.sanity.work:8080/v2025-02-19',
      }),
      makeCache(),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://abc123.api.sanity.work:8080/v2025-02-19/check/cors',
      {method: 'GET', credentials: 'omit'},
    )
  })

  it('reuses one cache entry across project-scoped and resource-scoped clients', async () => {
    // The cache is keyed by `projectId@apiHost`, which is identical for both.
    // That is only sound because both now probe the project host — otherwise
    // the resource-scoped client would file a global-host verdict under the
    // project's key and poison every later probe behind it.
    const fetchMock = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({result: {allowed: false, withCredentials: false}}),
        }) as Response,
    )
    globalThis.fetch = fetchMock as never
    const cache = makeCache()

    const fromResource = await checkCors(
      fakeResourceClient({type: 'media-library', id: 'ml123'}),
      cache,
    )
    const fromProject = await checkCors(fakeClient(), cache)

    expect(fromResource).toEqual(fromProject)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://abc123.api.sanity.io/vX/check/cors',
      expect.anything(),
    )
  })

  it('returns null for a resource-scoped client with no resolvable project host', async () => {
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as never

    const result = await checkCors(
      fakeClient({
        apiHost: 'not a url',
        resource: {type: 'media-library', id: 'ml123'},
        url: 'https://api.sanity.io/vX',
      }),
      makeCache(),
    )

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('evicts a positive verdict after settle so a later failure re-probes', async () => {
    const fetchMock = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({result: {allowed: true, withCredentials: true}}),
        }) as Response,
    )
    globalThis.fetch = fetchMock as never
    const cache = makeCache()
    const client = fakeClient()

    expect(await checkCors(client, cache)).toEqual({allowed: true, withCredentials: true})
    // A subsequent probe must re-fetch — a positive verdict can go stale if
    // CORS is changed in Manage while the studio is open.
    expect(await checkCors(client, cache)).toEqual({allowed: true, withCredentials: true})
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('caches a negative verdict so repeated failures during an outage reuse it', async () => {
    const fetchMock = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({result: {allowed: false, withCredentials: false}}),
        }) as Response,
    )
    globalThis.fetch = fetchMock as never
    const cache = makeCache()
    const client = fakeClient()

    await checkCors(client, cache)
    await checkCors(client, cache)
    // Negative verdict drives the CORS screen and its own forced rechecks —
    // no need to re-probe on every failing request behind it.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns null and evicts on a non-ok response (inconclusive)', async () => {
    const fetchMock = vi.fn(async () => ({ok: false, json: async () => ({})}) as Response)
    globalThis.fetch = fetchMock as never
    const cache = makeCache()
    const client = fakeClient()

    expect(await checkCors(client, cache)).toBeNull()
    // Inconclusive results are evicted so they can't poison later probes.
    await checkCors(client, cache)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns null when the fetch itself rejects', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    globalThis.fetch = fetchMock as never
    expect(await checkCors(fakeClient(), makeCache())).toBeNull()
  })

  it('force-refetches even when a cached entry exists', async () => {
    const fetchMock = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({result: {allowed: false, withCredentials: false}}),
        }) as Response,
    )
    globalThis.fetch = fetchMock as never
    const cache = makeCache()
    const client = fakeClient()

    await checkCors(client, cache)
    await checkCors(client, cache, {force: true})
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
