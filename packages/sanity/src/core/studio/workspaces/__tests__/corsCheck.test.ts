import {type SanityClient} from '@sanity/client'
import QuickLRU from 'quick-lru'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type CorsCheckCache, checkCors} from '../corsCheck'

function fakeClient(
  config: {projectId?: string; apiHost?: string; url?: string} = {},
): SanityClient {
  const resolved = {
    projectId: 'abc123',
    apiHost: 'https://api.sanity.io',
    url: 'https://abc123.api.sanity.io/v1',
    ...config,
  }
  return {config: () => resolved} as unknown as SanityClient
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
    vi.useRealTimers()
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
    expect(fetchMock).toHaveBeenCalledWith(
      'https://abc123.api.sanity.io/v1/check/cors?tag=sanity.studio.cors-probe',
      {
        method: 'GET',
        credentials: 'omit',
      },
    )
  })

  it('reuses a passing answer for 10 seconds instead of probing on every failure', async () => {
    vi.useFakeTimers({toFake: ['Date']})
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

    // A tab whose requests keep failing for a reason other than CORS (an
    // extension or VPN blocking them) calls checkCors once per failure.
    const start = Date.now()
    for (let i = 0; i < 10; i++) {
      // The last call is 9,999 ms after the first.
      vi.setSystemTime(start + i * 1111)
      expect(await checkCors(client, cache)).toEqual({allowed: true, withCredentials: true})
    }
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('counts the 10 seconds from when the probe answers, not from when it starts', async () => {
    vi.useFakeTimers({toFake: ['Date']})
    const {fetchMock, release} = deferredFetch({
      result: {allowed: true, withCredentials: true},
    })
    globalThis.fetch = fetchMock as never
    const cache = makeCache()
    const client = fakeClient()

    const slowProbe = checkCors(client, cache)
    vi.setSystemTime(Date.now() + 9000)
    release()
    await slowProbe
    vi.setSystemTime(Date.now() + 9000)
    await checkCors(client, cache)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not let an older probe replace the answer of a newer forced probe', async () => {
    const first = deferredFetch({result: {allowed: true, withCredentials: true}})
    const forced = deferredFetch({result: {allowed: false, withCredentials: false}})
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(first.fetchMock)
      .mockImplementationOnce(forced.fetchMock)
    globalThis.fetch = fetchMock as never
    const cache = makeCache()
    const client = fakeClient()

    const firstProbe = checkCors(client, cache)
    const forcedProbe = checkCors(client, cache, {force: true})
    // The older probe answers first. It must not put its passing answer back
    // in the cache over the forced probe that is still running.
    first.release()
    await firstProbe
    const laterCall = checkCors(client, cache)
    forced.release()
    await forcedProbe
    expect(await laterCall).toEqual({allowed: false, withCredentials: false})
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('probes again once 10 seconds have passed since a passing answer', async () => {
    vi.useFakeTimers({toFake: ['Date']})
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

    await checkCors(client, cache)
    // CORS can be changed in Manage while the studio is open, so a passing
    // answer must not be trusted for long.
    vi.setSystemTime(Date.now() + 10_001)
    await checkCors(client, cache)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('caches a negative verdict so repeated failures during an outage reuse it', async () => {
    vi.useFakeTimers({toFake: ['Date']})
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
    vi.setSystemTime(Date.now() + 60_000)
    await checkCors(client, cache)
    // Kept longer than a passing answer: a negative verdict drives the CORS
    // screen and its own forced rechecks, so there is no need to re-probe on
    // every failing request behind it.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns null on a non-ok response and reuses it for 10 seconds', async () => {
    vi.useFakeTimers({toFake: ['Date']})
    const fetchMock = vi.fn(async () => ({ok: false, json: async () => ({})}) as Response)
    globalThis.fetch = fetchMock as never
    const cache = makeCache()
    const client = fakeClient()

    expect(await checkCors(client, cache)).toBeNull()
    expect(await checkCors(client, cache)).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    // A probe failure may be transient, so it is only reused briefly.
    vi.setSystemTime(Date.now() + 10_001)
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
