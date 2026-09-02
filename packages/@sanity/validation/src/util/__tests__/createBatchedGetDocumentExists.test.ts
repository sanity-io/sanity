import {type SanityClient} from '@sanity/client'
import {from, map, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

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
        request: vi.fn(() => of({omitted: [{id: 'baz', reason: 'existence'}]})),
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
        // oxlint-disable-next-line no-explicit-any
        request: vi.fn((_params: any) => of({omitted: []})),
      },
    }

    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const ids = Array.from({length: MAX_BUFFER_SIZE + 1}).map((_, i) => i.toString())
    const results = await Promise.all(ids.map((id) => getDocumentExists({id})))

    expect(results.every((result) => result === true))
    expect(mockClient.observable.request).toHaveBeenCalledTimes(2)
    const [firstCall, secondCall] = mockClient.observable.request.mock.calls

    expect(firstCall[0].url).toEqual(
      `https://example.com/doc/${ids.slice(0, MAX_BUFFER_SIZE).join(',')}`,
    )
    expect(secondCall[0].url).toEqual(
      `https://example.com/doc/${ids.slice(MAX_BUFFER_SIZE).join(',')}`,
    )
  })

  it(`limits the request concurrency to ${MAX_REQUEST_CONCURRENCY} at once`, async () => {
    let resolve!: () => void
    const promise = new Promise<void>((r) => (resolve = r))

    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      observable: {
        // oxlint-disable-next-line no-explicit-any
        request: vi.fn((_params: any) => from(promise).pipe(map(() => ({omitted: []})))),
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

  it('does not request an already-aborted check', async () => {
    const reason = new Error('cancelled')
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      observable: {
        request: vi.fn(() => of({omitted: []})),
      },
    }
    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    await expect(
      getDocumentExists({id: 'cancelled', signal: AbortSignal.abort(reason)}),
    ).rejects.toBe(reason)
    await timeout(300)

    expect(mockClient.observable.request).not.toHaveBeenCalled()
  })

  it('does not abort unrelated checks before their requests start', async () => {
    const controller = new AbortController()
    const reason = new Error('cancelled')
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      observable: {
        request: vi.fn(() => of({omitted: []})),
      },
    }
    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const cancelled = getDocumentExists({id: 'cancelled', signal: controller.signal})
    const active = getDocumentExists({id: 'active'})
    controller.abort(reason)

    await expect(cancelled).rejects.toBe(reason)
    await expect(active).resolves.toBe(true)
    expect(mockClient.observable.request).toHaveBeenCalledOnce()
    expect(mockClient.observable.request).toHaveBeenCalledWith(
      expect.objectContaining({signal: undefined}),
    )
  })

  it('passes the default signal to requests', async () => {
    const signal = new AbortController().signal
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      observable: {
        request: vi.fn(() => of({omitted: []})),
      },
    }
    const getDocumentExists = createBatchedGetDocumentExists(
      mockClient as unknown as SanityClient,
      signal,
    )

    await expect(getDocumentExists({id: 'document'})).resolves.toBe(true)

    expect(mockClient.observable.request).toHaveBeenCalledWith(expect.objectContaining({signal}))
  })
})
