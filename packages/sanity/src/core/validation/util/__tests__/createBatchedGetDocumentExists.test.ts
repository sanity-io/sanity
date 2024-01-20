import {describe, expect, it, jest} from '@jest/globals'
import {type SanityClient} from '@sanity/client'
import {from, map, of} from 'rxjs'

import {
  createBatchedGetDocumentExists,
  MAX_BUFFER_SIZE,
  MAX_REQUEST_CONCURRENCY,
} from '../createBatchedGetDocumentExists'

const timeout = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

describe('createBatchedGetDocumentExists', () => {
  it('returns a getDocumentExists function that batches calls for document existence', async () => {
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      observable: {
        request: jest.fn(() => of({omitted: [{id: 'baz', reason: 'existence'}]})),
      },
    }

    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const [fooExists, barExists, bazExists] = await Promise.all([
      getDocumentExists({id: 'foo'}),
      getDocumentExists({id: 'bar'}),
      getDocumentExists({id: 'baz'}),
    ])

    expect(fooExists).toBe(true)
    expect(barExists).toBe(true)
    expect(bazExists).toBe(false)

    expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
  })

  it(`has a max buffer size of ${MAX_BUFFER_SIZE} IDs and will send another request if over`, async () => {
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      observable: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        request: jest.fn((_params: any) => of({omitted: []})),
      },
    }

    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const ids = Array.from({length: MAX_BUFFER_SIZE + 1}).map((_, i) => i.toString())
    const results = await Promise.all(ids.map((id) => getDocumentExists({id})))

    expect(results.every((result) => result === true))
    expect(mockClient.observable.request).toHaveBeenCalledTimes(2)
    const [firstCall, secondCall] = mockClient.observable.request.mock.calls

    expect(firstCall[0].uri).toEqual(
      `https://example.com/doc/${ids.slice(0, MAX_BUFFER_SIZE).join(',')}`,
    )
    expect(secondCall[0].uri).toEqual(
      `https://example.com/doc/${ids.slice(MAX_BUFFER_SIZE).join(',')}`,
    )
  })

  it(`limits the request concurrency to ${MAX_REQUEST_CONCURRENCY} at once`, async () => {
    let resolve!: () => void
    const promise = new Promise<void>((r) => (resolve = r))

    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      observable: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        request: jest.fn((_params: any) => from(promise).pipe(map(() => ({omitted: []})))),
      },
    }

    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const ids = Array.from({length: MAX_BUFFER_SIZE * MAX_REQUEST_CONCURRENCY + 1}).map((_, i) =>
      i.toString(),
    )
    const resultsPromise = Promise.all(ids.map((id) => getDocumentExists({id})))

    await timeout(0)

    expect(mockClient.observable.request).toHaveBeenCalledTimes(MAX_REQUEST_CONCURRENCY)

    // completes the request and allows the limiter to allow another request
    resolve()

    const results = await resultsPromise
    expect(results.every((result) => result === true))
    expect(mockClient.observable.request).toHaveBeenCalledTimes(MAX_REQUEST_CONCURRENCY + 1)
  })
})
