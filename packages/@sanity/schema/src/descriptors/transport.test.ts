import {HttpError} from 'get-it'
import {createMockFetch} from 'get-it/mock'
import {afterEach, describe, expect, test} from 'vitest'

import {createGetItRequester, defaultShouldRetry} from './transport'

const BASE = 'https://api.example'
const CLAIM = '/v2025-06-01/descriptors/claim'
const COMMIT = '/v2025-06-01/descriptors/commit'
const SYNCHRONIZE = '/v2025-06-01/descriptors/synchronize'

const mock = createMockFetch()

function requester() {
  return createGetItRequester({baseUrl: BASE, fetch: mock.fetch})
}

/**
 * Drive a real get-it request against a mocked status so `defaultShouldRetry`
 * is asserted against the `HttpError` v9 actually throws — not a hand-built
 * stand-in. `maxRetries: 0` keeps 5xx from being swallowed by the retry loop.
 */
async function httpErrorFrom(status: number): Promise<HttpError> {
  mock.clear()
  mock.on('POST', `${BASE}${CLAIM}`).respond({status, body: {error: 'x'}})
  try {
    await requester()({url: CLAIM, method: 'POST', body: {}, maxRetries: 0})
  } catch (err) {
    if (err instanceof HttpError) return err
    throw err
  }
  throw new Error(`expected HTTP ${status}`)
}

describe('defaultShouldRetry', () => {
  afterEach(() => {
    mock.clear()
  })

  test('retries on 429 and 5xx, not on 4xx or non-http errors', async () => {
    expect(defaultShouldRetry(await httpErrorFrom(429))).toBe(true)
    expect(defaultShouldRetry(await httpErrorFrom(503))).toBe(true)
    expect(defaultShouldRetry(await httpErrorFrom(500))).toBe(true)
    expect(defaultShouldRetry(await httpErrorFrom(404))).toBe(false)
    // A 2xx never becomes an HttpError; the v8-shaped bag the old test passed
    // in is also not an HttpError, so the predicate stays false.
    expect(defaultShouldRetry({response: {statusCode: 200}})).toBe(false)
    expect(defaultShouldRetry(new Error('boom'))).toBe(false)
    expect(defaultShouldRetry(undefined)).toBe(false)
  })
})

describe('createGetItRequester', () => {
  afterEach(() => {
    mock.clear()
  })

  test('resolves relative URLs against the base URL and sends Accept: application/json', async () => {
    mock.on('POST', `${BASE}${CLAIM}`).respond({status: 200, body: {ok: true}})

    await requester()({url: CLAIM, method: 'POST', body: {descriptorId: 'd1'}})

    const [recorded] = mock.getRequests()
    expect(recorded!.method).toBe('POST')
    expect(recorded!.fullUrl).toBe(`${BASE}${CLAIM}`)
    expect(recorded!.headers.get('accept')).toBe('application/json')
    mock.assertAllConsumed()
  })

  test('serializes an object body as JSON and resolves with the parsed response body', async () => {
    mock
      .on('POST', `${BASE}${CLAIM}`)
      .respond({status: 200, body: {synchronization: {type: 'complete'}, commitId: 'c1'}})

    const result = await requester()<{commitId: string}>({
      url: CLAIM,
      method: 'POST',
      body: {descriptorId: 'd1', permanent: true},
    })

    expect(result).toEqual({synchronization: {type: 'complete'}, commitId: 'c1'})
    const [recorded] = mock.getRequests()
    expect(recorded!.headers.get('content-type')).toBe('application/json')
    expect(recorded!.body).toEqual({descriptorId: 'd1', permanent: true})
    mock.assertAllConsumed()
  })

  test('resolves undefined for an empty response body instead of throwing', async () => {
    mock.on('POST', `${BASE}${COMMIT}`).respond({status: 204})

    const result = await requester()({url: COMMIT, method: 'POST', body: {id: 'c1'}})
    expect(result).toBeUndefined()
    mock.assertAllConsumed()
  })

  test('resolves with the raw text for non-JSON responses', async () => {
    mock
      .on('POST', `${BASE}${COMMIT}`)
      .respond({status: 200, body: 'ok', headers: {'content-type': 'text/plain'}})

    const result = await requester()({url: COMMIT, method: 'POST', body: {id: 'c1'}})
    expect(result).toBe('ok')
    mock.assertAllConsumed()
  })

  test('retries a 429 and resolves with the eventual success body', async () => {
    mock
      .on('POST', `${BASE}${CLAIM}`)
      .respond({status: 429, body: {error: 'Too many requests'}})
      .respond({status: 200, body: {synchronization: {type: 'complete'}, commitId: 'c1'}})

    const result = await requester()<{commitId: string}>({
      url: CLAIM,
      method: 'POST',
      body: {descriptorId: 'd1'},
    })

    expect(result).toEqual({synchronization: {type: 'complete'}, commitId: 'c1'})
    expect(mock.getRequests()).toHaveLength(2)
    mock.assertAllConsumed()
  })

  test('does not retry a 404', async () => {
    mock.on('POST', `${BASE}${CLAIM}`).respondPersist({status: 404, body: {error: 'Not found'}})

    const promise = requester()({url: CLAIM, method: 'POST', body: {descriptorId: 'd1'}})

    await expect(promise).rejects.toBeInstanceOf(HttpError)
    await expect(promise).rejects.toMatchObject({status: 404})
    expect(mock.getRequests()).toHaveLength(1)
  })

  test('gives up on persistent 5xx after the per-request maxRetries budget', async () => {
    mock
      .on('POST', `${BASE}${SYNCHRONIZE}`)
      .respondPersist({status: 503, body: {error: 'Unavailable'}})

    const promise = requester()({
      url: SYNCHRONIZE,
      method: 'POST',
      body: {id: 'd1'},
      maxRetries: 2,
    })

    await expect(promise).rejects.toMatchObject({status: 503})
    expect(mock.getRequests()).toHaveLength(3)
  })
})
