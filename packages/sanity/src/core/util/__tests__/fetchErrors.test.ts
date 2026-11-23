import {ClientError, CorsOriginError, ServerError} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {isTransientFetchError} from '../fetchErrors'

function response(statusCode: number) {
  return {statusCode, headers: {}, body: {}, url: 'https://example.api.sanity.io', method: 'GET'}
}

describe('isTransientFetchError', () => {
  it.each([500, 502, 503, 504])('is transient for a %d', (status) => {
    expect(isTransientFetchError(new ServerError(response(status)))).toBe(true)
  })

  it.each([408, 429])('is transient for a %d', (status) => {
    expect(isTransientFetchError(new ClientError(response(status)))).toBe(true)
  })

  it.each([400, 401, 403, 404])('is not transient for a %d', (status) => {
    expect(isTransientFetchError(new ClientError(response(status)))).toBe(false)
  })

  it('matches a response error from another client copy by shape', () => {
    const error = Object.assign(new Error('Service unavailable'), {
      statusCode: 503,
      response: response(503),
    })
    expect(isTransientFetchError(error)).toBe(true)
  })

  it('is transient for a network failure', () => {
    expect(isTransientFetchError(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('is transient for a response timeout', () => {
    const error = Object.assign(new Error('Request timed out'), {name: 'TimeoutError'})
    expect(isTransientFetchError(error)).toBe(true)
  })

  it.each([
    ['an aborted request', Object.assign(new Error('Aborted'), {name: 'AbortError'})],
    ['a CORS origin error', new CorsOriginError({projectId: 'abc123'})],
    ['a plain error', new Error('Something broke')],
    ['a non-error value', 'Internal error'],
  ])('is not transient for %s', (_, error) => {
    expect(isTransientFetchError(error)).toBe(false)
  })
})
