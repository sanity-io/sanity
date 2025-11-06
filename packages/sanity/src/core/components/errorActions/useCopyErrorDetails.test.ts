import {firstValueFrom, map, of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {type ErrorWithId} from './types'
import {serializeError} from './useCopyErrorDetails'

describe('serializeError', () => {
  it('includes error properties if an instance of `Error` is provided', async () => {
    const error = await reassembleError({
      error: new Error('Test', {
        cause: 'Unit test',
      }),
    })

    expect((error.error as any).message).toBe('Test')
    expect((error.error as any).cause).toBe('Unit test')
  })

  it('includes record-like errors', async () => {
    const error = await reassembleError({
      error: {
        someProperty: 'someValue',
      },
    })

    expect((error.error as any).someProperty).toBe('someValue')
  })

  const nonRecordCases = [123, 'someString', ['some', 'array'], Symbol('Some error')]

  it.each(nonRecordCases)('does not include non-record errors', async (errorCase) => {
    const {error} = await reassembleError({
      error: errorCase,
    })
    expect(error).toBeUndefined()
  })

  it('includes event id if one is provided', async () => {
    const {eventId} = await reassembleError({
      error: new Error(),
      eventId: '123',
    })

    expect(eventId).toBe('123')
  })

  it('should not include Authorization header in error details when using fetch', async () => {
    // Create a mock fetch error that includes Authorization header in the request
    const mockFetchError = new Error('Request failed')
    // Simulate what happens when fetch fails - the error object might contain request details
    Object.assign(mockFetchError, {
      request: {
        url: 'https://api.sanity.io/v1/data/query',
        headers: {
          'Authorization': 'Bearer secret-token',
          'Content-Type': 'application/json',
          'x-sanity-app': 'studio@3.0.0',
        },
      },
      response: {
        status: 401,
        statusText: 'Unauthorized',
      },
    })

    const serializedError = await reassembleError({
      error: mockFetchError,
      eventId: 'test-auth-leak',
    })

    // Check if Authorization header is leaked in the serialized error
    const errorString = JSON.stringify(serializedError, null, 2)

    // This test should PASS - Authorization header should be redacted
    expect(errorString).not.toContain('Bearer secret-token')
    expect(errorString).toContain('[hidden]')

    // But we can verify other details are still present
    expect(serializedError.eventId).toBe('test-auth-leak')
    expect((serializedError.error as any).message).toBe('Request failed')

    // Non-sensitive headers should be preserved
    expect(errorString).toContain('Content-Type')
    expect(errorString).toContain('application/json')
    expect(errorString).toContain('x-sanity-app')
  })
})

/**
 * Helper that serializes and then immediately deserializes the provided error so that assertions
 * about the serialization process can be made.
 */
function reassembleError(error: ErrorWithId): Promise<ErrorWithId> {
  return firstValueFrom(
    of(error).pipe(
      serializeError(),
      map((serializedError) => JSON.parse(serializedError)),
    ),
  )
}
