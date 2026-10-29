import {type SanityClient} from '@sanity/client'
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
      request: vi.fn(async () => ({omitted: [{id: 'baz', reason: 'existence'}]})),
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

    expect(mockClient.request).toHaveBeenCalledTimes(1)
  })

  it(`has a max buffer size of ${MAX_BUFFER_SIZE} IDs and will send another request if over`, async () => {
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      // oxlint-disable-next-line no-explicit-any
      request: vi.fn(async (_params: any) => ({omitted: []})),
    }

    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const ids = Array.from({length: MAX_BUFFER_SIZE + 1}).map((_, i) => i.toString())
    const results = await Promise.all(ids.map((id) => getDocumentExists({id})))

    expect(results.every((result) => result === true))
    expect(mockClient.request).toHaveBeenCalledTimes(2)
    const [firstCall, secondCall] = mockClient.request.mock.calls

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
      // oxlint-disable-next-line no-explicit-any
      request: vi.fn(async (_params: any) => {
        await promise
        return {omitted: []}
      }),
    }

    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const ids = Array.from({length: MAX_BUFFER_SIZE * MAX_REQUEST_CONCURRENCY + 1}).map((_, i) =>
      i.toString(),
    )
    const resultsPromise = Promise.all(ids.map((id) => getDocumentExists({id})))

    await timeout(0)

    expect(mockClient.request).toHaveBeenCalledTimes(MAX_REQUEST_CONCURRENCY)

    // completes the request and allows the limiter to allow another request
    resolve()

    const results = await resultsPromise
    expect(results.every((result) => result === true))
    expect(mockClient.request).toHaveBeenCalledTimes(MAX_REQUEST_CONCURRENCY + 1)
  })

  it('does not request an already-aborted check', async () => {
    const reason = new Error('cancelled')
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      request: vi.fn(async () => ({omitted: []})),
    }
    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    await expect(
      getDocumentExists({id: 'cancelled', signal: AbortSignal.abort(reason)}),
    ).rejects.toBe(reason)
    await timeout(300)

    expect(mockClient.request).not.toHaveBeenCalled()
  })

  it('does not abort unrelated checks before their requests start', async () => {
    const controller = new AbortController()
    const reason = new Error('cancelled')
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      request: vi.fn(async () => ({omitted: []})),
    }
    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const cancelled = getDocumentExists({id: 'cancelled', signal: controller.signal})
    const active = getDocumentExists({id: 'active'})
    controller.abort(reason)

    await expect(cancelled).rejects.toBe(reason)
    await expect(active).resolves.toBe(true)
    expect(mockClient.request).toHaveBeenCalledOnce()
    expect(mockClient.request).toHaveBeenCalledWith(expect.objectContaining({signal: undefined}))
  })

  it('cancels one caller without aborting a shared request', async () => {
    const controller = new AbortController()
    const reason = new Error('cancelled')
    let resolveResponse!: (response: {
      omitted: {id: string; reason: 'existence' | 'permission'}[]
    }) => void
    const response = new Promise<{
      omitted: {id: string; reason: 'existence' | 'permission'}[]
    }>((resolve) => {
      resolveResponse = resolve
    })
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      request: vi.fn(() => response),
    }
    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const cancelled = getDocumentExists({id: 'cancelled', signal: controller.signal})
    const active = getDocumentExists({id: 'active'})
    await vi.waitFor(() => expect(mockClient.request).toHaveBeenCalledOnce())
    controller.abort(reason)

    await expect(cancelled).rejects.toBe(reason)
    resolveResponse({omitted: []})
    await expect(active).resolves.toBe(true)
    expect(mockClient.request).toHaveBeenCalledOnce()
    expect(mockClient.request).toHaveBeenCalledWith(expect.objectContaining({signal: undefined}))
  })

  it('cancels active and queued batches with the default signal', async () => {
    const controller = new AbortController()
    const reason = new Error('validation cancelled')
    const aborted = vi.fn()
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      request: vi.fn(
        ({signal}: {signal?: AbortSignal}) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener(
              'abort',
              () => {
                aborted()
                reject(signal.reason)
              },
              {once: true},
            )
          }),
      ),
    }
    const getDocumentExists = createBatchedGetDocumentExists(
      mockClient as unknown as SanityClient,
      controller.signal,
    )
    const checks = Promise.all(
      Array.from({length: MAX_BUFFER_SIZE + 1}, (_, index) =>
        getDocumentExists({id: index.toString()}),
      ),
    )
    await vi.waitFor(() => expect(mockClient.request).toHaveBeenCalledOnce())

    controller.abort(reason)

    await expect(checks).rejects.toBe(reason)
    expect(aborted).toHaveBeenCalledOnce()
    await timeout(300)
    expect(mockClient.request).toHaveBeenCalledOnce()
  })

  it('rejects all pending checks when a request fails', async () => {
    const error = new Error('request failed')
    let rejectRequest!: (reason: unknown) => void
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      request: vi.fn(
        () =>
          new Promise((_resolve, reject) => {
            rejectRequest = reject
          }),
      ),
    }
    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)
    const checks = Array.from({length: MAX_BUFFER_SIZE + 1}, (_, index) =>
      getDocumentExists({id: index.toString()}),
    )

    await vi.waitFor(() => expect(mockClient.request).toHaveBeenCalledOnce())
    rejectRequest(error)

    const results = await Promise.allSettled(checks)
    expect(results).toEqual(
      checks.map(() => ({status: 'rejected', reason: error}) satisfies PromiseRejectedResult),
    )
    await timeout(300)
    expect(mockClient.request).toHaveBeenCalledOnce()
  })
})
