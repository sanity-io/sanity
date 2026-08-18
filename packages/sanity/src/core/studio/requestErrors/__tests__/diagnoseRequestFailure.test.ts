import {ClientError, type SanityClient} from '@sanity/client'
import QuickLRU from 'quick-lru'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type CorsCheckCache} from '../../workspaces/corsCheck'
import {createRequestFailureProbe} from '../diagnoseRequestFailure'

function fakeClient(): SanityClient {
  return {
    config: () => ({
      projectId: 'abc123',
      apiHost: 'https://api.sanity.io',
      url: 'https://abc123.api.sanity.io/v1',
    }),
  } as unknown as SanityClient
}

function makeCache(): CorsCheckCache {
  return new QuickLRU({maxAge: 1000 * 60 * 2, maxSize: 200})
}

function clientError(statusCode: number, body: Record<string, unknown>): ClientError {
  return new ClientError({
    statusCode,
    headers: {},
    body,
    url: 'https://abc123.api.sanity.io/v1/foo',
    method: 'GET',
  } as never)
}

function networkError(): Error {
  return Object.assign(new Error('Failed to fetch'), {isNetworkError: true})
}

/** Mock `fetch` for the `/check/cors` probe with a given status + body. */
function mockCorsFetch(status: number, body: unknown) {
  globalThis.fetch = vi.fn(
    async () => ({ok: status >= 200 && status < 300, status, json: async () => body}) as Response,
  ) as never
}

describe('createRequestFailureProbe', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('classifies a structured project-not-found 404 (no network probe)', async () => {
    const probe = createRequestFailureProbe(fakeClient(), makeCache())
    const err = clientError(404, {error: 'Not Found', attributes: {type: 'project'}})
    expect(await probe(err)).toEqual({type: 'project-not-found'})
  })

  it('classifies a structured dataset-not-found 404', async () => {
    const probe = createRequestFailureProbe(fakeClient(), makeCache())
    const err = clientError(404, {error: 'Dataset not found'})
    expect(await probe(err)).toEqual({type: 'dataset-not-found'})
  })

  it('probes /check/cors on a network error and reports project-not-found', async () => {
    mockCorsFetch(404, {errorCode: 'SIO-404-PNF', message: 'Project not found'})
    const probe = createRequestFailureProbe(fakeClient(), makeCache())
    expect(await probe(networkError())).toEqual({type: 'project-not-found'})
  })

  it('probes /check/cors on a network error and reports a CORS misconfig', async () => {
    mockCorsFetch(200, {result: {allowed: false, withCredentials: false}})
    const probe = createRequestFailureProbe(fakeClient(), makeCache())
    expect(await probe(networkError())).toEqual({
      type: 'cors',
      allowed: false,
      withCredentials: false,
    })
  })

  it('returns unknown when CORS is fully satisfied (not the cause)', async () => {
    mockCorsFetch(200, {result: {allowed: true, withCredentials: true}})
    const probe = createRequestFailureProbe(fakeClient(), makeCache())
    expect(await probe(networkError())).toEqual({type: 'unknown'})
  })

  it('returns unknown for a non-network, non-config error', async () => {
    const probe = createRequestFailureProbe(fakeClient(), makeCache())
    expect(await probe(clientError(500, {error: 'boom'}))).toEqual({type: 'unknown'})
    expect(await probe(new Error('nope'))).toEqual({type: 'unknown'})
  })
})
