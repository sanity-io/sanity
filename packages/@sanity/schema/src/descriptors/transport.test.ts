import {type BufferedResponse, HttpError} from 'get-it'
import {createMockFetch} from 'get-it/mock'
import {describe, expect, test} from 'vitest'

import {createGetItRequester, defaultShouldRetry} from './transport'

/** Build the v9 error an HTTP failure surfaces as (what `retry()` hands to `shouldRetry`). */
function httpError(status: number): HttpError {
  const body = new Uint8Array()
  const response: BufferedResponse = {
    status,
    statusText: '',
    headers: new Headers(),
    body,
    json: () => undefined,
    text: () => '',
    bytes: () => body,
  }
  return new HttpError({
    url: 'https://api.example/v2025-06-01/descriptors/claim',
    method: 'POST',
    status,
    statusText: '',
    headers: new Headers(),
    body: '',
    response,
  })
}

describe('defaultShouldRetry', () => {
  test('retries on 429 and 5xx, not on other 4xx or non-http errors', () => {
    expect(defaultShouldRetry(httpError(429))).toBe(true)
    expect(defaultShouldRetry(httpError(500))).toBe(true)
    expect(defaultShouldRetry(httpError(503))).toBe(true)
    expect(defaultShouldRetry(httpError(404))).toBe(false)
    expect(defaultShouldRetry(new Error('boom'))).toBe(false)
    expect(defaultShouldRetry(undefined)).toBe(false)
  })
})

describe('createGetItRequester', () => {
  test('resolves relative URLs against the base URL and sends Accept: application/json', async () => {
    const mock = createMockFetch()
    mock.on('POST', '/v2025-06-01/descriptors/claim').respond({status: 200, body: {ok: true}})

    const requester = createGetItRequester({baseUrl: 'https://api.example'})
    await requester({
      url: '/v2025-06-01/descriptors/claim',
      method: 'POST',
      body: {descriptorId: 'd1'},
      fetch: mock.fetch,
    })

    const [recorded] = mock.getRequests()
    expect(recorded!.fullUrl).toBe('https://api.example/v2025-06-01/descriptors/claim')
    expect(recorded!.headers.get('accept')).toBe('application/json')
    mock.assertAllConsumed()
  })

  test('serializes an object body as JSON and resolves with the parsed response body', async () => {
    const mock = createMockFetch()
    mock
      .on('POST', '/v2025-06-01/descriptors/claim')
      .respond({status: 200, body: {synchronization: {type: 'complete'}, commitId: 'c1'}})

    const requester = createGetItRequester({baseUrl: 'https://api.example'})
    const result = await requester<{commitId: string}>({
      url: '/v2025-06-01/descriptors/claim',
      method: 'POST',
      body: {descriptorId: 'd1', permanent: true},
      fetch: mock.fetch,
    })

    expect(result).toEqual({synchronization: {type: 'complete'}, commitId: 'c1'})
    const [recorded] = mock.getRequests()
    expect(recorded!.headers.get('content-type')).toBe('application/json')
    expect(recorded!.body).toEqual({descriptorId: 'd1', permanent: true})
  })

  test('resolves undefined for an empty response body instead of throwing', async () => {
    const mock = createMockFetch()
    mock.on('POST', '/v2025-06-01/descriptors/commit').respond({status: 204})

    const requester = createGetItRequester({baseUrl: 'https://api.example'})
    const result = await requester({
      url: '/v2025-06-01/descriptors/commit',
      method: 'POST',
      body: {id: 'c1'},
      fetch: mock.fetch,
    })
    expect(result).toBeUndefined()
  })

  test('resolves with the raw text for non-JSON responses', async () => {
    const mock = createMockFetch()
    mock
      .on('POST', '/v2025-06-01/descriptors/commit')
      .respond({status: 200, body: 'ok', headers: {'content-type': 'text/plain'}})

    const requester = createGetItRequester({baseUrl: 'https://api.example'})
    const result = await requester({
      url: '/v2025-06-01/descriptors/commit',
      method: 'POST',
      body: {id: 'c1'},
      fetch: mock.fetch,
    })
    expect(result).toBe('ok')
  })

  test('retries a 429 and resolves with the eventual success body', async () => {
    const mock = createMockFetch()
    mock
      .on('POST', '/v2025-06-01/descriptors/claim')
      .respond({status: 429, body: {error: 'Too many requests'}})
      .respond({status: 200, body: {synchronization: {type: 'complete'}, commitId: 'c1'}})

    const requester = createGetItRequester({baseUrl: 'https://api.example'})
    const result = await requester<{commitId: string}>({
      url: '/v2025-06-01/descriptors/claim',
      method: 'POST',
      body: {descriptorId: 'd1'},
      fetch: mock.fetch,
    })

    expect(result).toEqual({synchronization: {type: 'complete'}, commitId: 'c1'})
    expect(mock.getRequests()).toHaveLength(2)
  })

  test('does not retry a 404', async () => {
    const mock = createMockFetch()
    mock
      .on('POST', '/v2025-06-01/descriptors/claim')
      .respondPersist({status: 404, body: {error: 'Not found'}})

    const requester = createGetItRequester({baseUrl: 'https://api.example'})
    const promise = requester({
      url: '/v2025-06-01/descriptors/claim',
      method: 'POST',
      body: {descriptorId: 'd1'},
      fetch: mock.fetch,
    })

    await expect(promise).rejects.toBeInstanceOf(HttpError)
    await expect(promise).rejects.toMatchObject({status: 404})
    expect(mock.getRequests()).toHaveLength(1)
  })

  test('gives up on persistent 5xx after the per-request maxRetries budget', async () => {
    const mock = createMockFetch()
    mock
      .on('POST', '/v2025-06-01/descriptors/synchronize')
      .respondPersist({status: 503, body: {error: 'Unavailable'}})

    const requester = createGetItRequester({baseUrl: 'https://api.example'})
    const promise = requester({
      url: '/v2025-06-01/descriptors/synchronize',
      method: 'POST',
      body: {id: 'd1'},
      maxRetries: 2,
      fetch: mock.fetch,
    })

    await expect(promise).rejects.toMatchObject({status: 503})
    expect(mock.getRequests()).toHaveLength(3)
  })
})
