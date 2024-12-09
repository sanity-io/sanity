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
