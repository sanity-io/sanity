import {createClient} from '@sanity/client'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import type * as ListenerCountExports from './listenerCount'

type ListenerCountModule = typeof ListenerCountExports

const EVENT_STREAM_HEADERS = {Accept: 'text/event-stream'}

function createEventStream(): {
  response: Response
  push: (text: string) => void
  end: () => void
} {
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller
    },
  })
  const encoder = new TextEncoder()
  return {
    response: new Response(body, {headers: {'content-type': 'text/event-stream'}}),
    push: (text) => streamController?.enqueue(encoder.encode(text)),
    end: () => streamController?.close(),
  }
}

async function drain(body: ReadableStream<Uint8Array> | null): Promise<void> {
  const reader = body?.getReader()
  let chunk = await reader?.read()
  while (chunk?.done === false) {
    chunk = await reader?.read()
  }
}

describe('listener counting fetch', () => {
  let listenerCount: ListenerCountModule

  beforeEach(async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn())
    listenerCount = await import('./listenerCount')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('counts a listener opened through client.listen until it is unsubscribed', async () => {
    const stream = createEventStream()
    vi.mocked(fetch).mockResolvedValue(stream.response)
    const client = createClient({
      projectId: 'abc123',
      dataset: 'production',
      apiVersion: '2025-03-01',
      useCdn: false,
      resolveFetch: listenerCount.resolveListenerCountingFetch,
    })

    const welcomed = new Promise<void>((resolve) => {
      const subscription = client.listen('*', {}, {events: ['welcome']}).subscribe(() => {
        subscription.unsubscribe()
        resolve()
      })
    })
    await vi.waitFor(() => expect(listenerCount.getListenerCounts().open).toBe(1))
    stream.push('event: welcome\ndata: {"listenerName":"test"}\n\n')
    await welcomed

    await vi.waitFor(() => expect(listenerCount.getListenerCounts()).toEqual({open: 0, peak: 1}))
  })

  it('passes requests that are not event streams through untouched', async () => {
    const response = new Response('{}')
    vi.mocked(fetch).mockResolvedValue(response)
    const countingFetch = listenerCount.resolveListenerCountingFetch()

    await expect(countingFetch('https://abc123.api.sanity.io/v1/data/query')).resolves.toBe(
      response,
    )
    expect(listenerCount.getListenerCounts()).toEqual({open: 0, peak: 0})
  })

  it('keeps a listener open until the server ends its stream', async () => {
    const stream = createEventStream()
    vi.mocked(fetch).mockResolvedValue(stream.response)
    const countingFetch = listenerCount.resolveListenerCountingFetch()

    const response = await countingFetch('https://abc123.api.sanity.io/v1/data/listen', {
      headers: EVENT_STREAM_HEADERS,
    })
    expect(listenerCount.getListenerCounts().open).toBe(1)

    stream.end()
    await drain(response.body)

    expect(listenerCount.getListenerCounts()).toEqual({open: 0, peak: 1})
  })

  it('closes a listener when its request is aborted', async () => {
    vi.mocked(fetch).mockResolvedValue(createEventStream().response)
    const countingFetch = listenerCount.resolveListenerCountingFetch()
    const abortController = new AbortController()

    await countingFetch('https://abc123.api.sanity.io/v1/data/listen', {
      headers: EVENT_STREAM_HEADERS,
      signal: abortController.signal,
    })
    abortController.abort()

    expect(listenerCount.getListenerCounts()).toEqual({open: 0, peak: 1})
  })

  it('closes a listener whose request fails or is rejected by the server', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response('Unauthorized', {status: 401}))
      .mockResolvedValueOnce(new Response('{}', {headers: {'content-type': 'application/json'}}))
    const countingFetch = listenerCount.resolveListenerCountingFetch()
    const listen = () =>
      countingFetch('https://abc123.api.sanity.io/v1/data/listen', {
        headers: EVENT_STREAM_HEADERS,
      })

    await expect(listen()).rejects.toThrow('Failed to fetch')
    await expect(listen()).resolves.toMatchObject({status: 401})
    await expect(listen()).resolves.toMatchObject({status: 200})

    expect(listenerCount.getListenerCounts()).toEqual({open: 0, peak: 1})
  })

  it('records the most listeners open at once', async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(createEventStream().response))
    const countingFetch = listenerCount.resolveListenerCountingFetch()
    const controllers = [new AbortController(), new AbortController(), new AbortController()]

    await Promise.all(
      controllers.map((controller) =>
        countingFetch('https://abc123.api.sanity.io/v1/data/listen', {
          headers: EVENT_STREAM_HEADERS,
          signal: controller.signal,
        }),
      ),
    )
    controllers.forEach((controller) => controller.abort())

    expect(listenerCount.getListenerCounts()).toEqual({open: 0, peak: 3})
  })
})
