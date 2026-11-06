import {describe, expect, it, vi} from 'vitest'

import {
  createRequestActivityTracker,
  createTrackedFetch,
  type TrackedFetchFunction,
} from './requestActivity'

const QUERY_URL =
  'https://project-id.api.sanity.io/v2025-02-19/data/query/production?query=*%5B_id%3D%3D%22secret%22%5D&tag=sanity.studio.document-list'
const LISTEN_URL =
  'https://project-id.api.sanity.io/v2025-02-19/data/listen/production?query=*&tag=sanity.studio.document.pair.listen'

const neverResponds: TrackedFetchFunction = () => new Promise(() => undefined)

function createClock() {
  let time = 1000
  return {now: () => time, advance: (ms: number) => (time += ms)}
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, reject, resolve}
}

function streamingResponse() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start: (streamController) => {
      controller = streamController
    },
  })
  return {
    close: () => controller.close(),
    response: new Response(body, {headers: {'content-type': 'text/event-stream'}}),
  }
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('createTrackedFetch', () => {
  it('counts a request as pending until its response headers arrive', async () => {
    const clock = createClock()
    const tracker = createRequestActivityTracker(clock.now)
    const response = deferred<Response>()
    const trackedFetch = createTrackedFetch(tracker, () => () => response.promise)

    const result = trackedFetch(QUERY_URL)
    clock.advance(4200)

    expect(tracker.getSnapshot()).toEqual({
      longestPending: [
        {
          ageMs: 4200,
          bucket: 'query',
          kind: 'request',
          projectId: 'project-id',
          tag: 'sanity.studio.document-list',
        },
      ],
      oldestPendingMs: 4200,
      openStreams: 0,
      pendingRequests: 1,
      totalStarted: 1,
    })

    response.resolve(new Response('{}'))
    await result

    expect(tracker.getSnapshot()).toMatchObject({openStreams: 0, pendingRequests: 0})
  })

  it('never includes the query or other URL details beyond the type and tag', async () => {
    const tracker = createRequestActivityTracker()
    const trackedFetch = createTrackedFetch(tracker, () => () => new Promise(() => undefined))

    void trackedFetch(QUERY_URL)

    expect(JSON.stringify(tracker.getSnapshot())).not.toContain('secret')
  })

  it('keeps an event stream open until it is aborted', async () => {
    const tracker = createRequestActivityTracker()
    const {response} = streamingResponse()
    const trackedFetch = createTrackedFetch(tracker, () => () => Promise.resolve(response))
    const abortController = new AbortController()

    await trackedFetch(LISTEN_URL, {
      headers: {Accept: 'text/event-stream'},
      signal: abortController.signal,
    })

    expect(tracker.getSnapshot()).toMatchObject({openStreams: 1, pendingRequests: 0})

    abortController.abort()

    expect(tracker.getSnapshot()).toMatchObject({openStreams: 0, pendingRequests: 0})
  })

  it('notices when the server ends an event stream without an abort', async () => {
    const tracker = createRequestActivityTracker()
    const stream = streamingResponse()
    const trackedFetch = createTrackedFetch(tracker, () => () => Promise.resolve(stream.response))

    const response = await trackedFetch(LISTEN_URL, {headers: {Accept: 'text/event-stream'}})
    expect(tracker.getSnapshot().openStreams).toBe(1)

    // The consumer still gets a readable, untouched body
    const reading = response.text()
    stream.close()
    await reading
    await flush()

    expect(tracker.getSnapshot().openStreams).toBe(0)
  })

  it('treats listen URLs as streams even without an accept header', async () => {
    const tracker = createRequestActivityTracker()
    const {response} = streamingResponse()
    const trackedFetch = createTrackedFetch(tracker, () => () => Promise.resolve(response))

    await trackedFetch(LISTEN_URL)

    expect(tracker.getSnapshot().openStreams).toBe(1)
  })

  it('stops tracking a request that fails', async () => {
    const tracker = createRequestActivityTracker()
    const trackedFetch = createTrackedFetch(
      tracker,
      () => () => Promise.reject(new TypeError('Failed to fetch')),
    )

    await expect(trackedFetch(QUERY_URL)).rejects.toThrow('Failed to fetch')

    expect(tracker.getSnapshot()).toMatchObject({
      openStreams: 0,
      pendingRequests: 0,
      totalStarted: 1,
    })
  })

  it('stops tracking a pending request when its signal aborts', () => {
    const tracker = createRequestActivityTracker()
    const trackedFetch = createTrackedFetch(tracker, () => () => new Promise(() => undefined))
    const abortController = new AbortController()

    void trackedFetch(QUERY_URL, {signal: abortController.signal})
    expect(tracker.getSnapshot().pendingRequests).toBe(1)

    abortController.abort()

    expect(tracker.getSnapshot().pendingRequests).toBe(0)
  })

  it('lists the longest-waiting requests first, up to five', () => {
    const clock = createClock()
    const tracker = createRequestActivityTracker(clock.now)
    const trackedFetch = createTrackedFetch(tracker, () => neverResponds)

    for (let i = 0; i < 7; i++) {
      void trackedFetch(`${QUERY_URL}&n=${i}`)
      clock.advance(100)
    }

    const snapshot = tracker.getSnapshot()
    expect(snapshot.pendingRequests).toBe(7)
    expect(snapshot.oldestPendingMs).toBe(700)
    expect(snapshot.longestPending.map(({ageMs}) => ageMs)).toEqual([700, 600, 500, 400, 300])
  })

  it('resolves the base fetch per request', async () => {
    const tracker = createRequestActivityTracker()
    const baseFetch = vi.fn<TrackedFetchFunction>(() => Promise.resolve(new Response('{}')))
    const getBaseFetch = vi.fn(() => baseFetch)
    const trackedFetch = createTrackedFetch(tracker, getBaseFetch)

    await trackedFetch(QUERY_URL)
    await trackedFetch(QUERY_URL)

    expect(getBaseFetch).toHaveBeenCalledTimes(2)
    expect(baseFetch).toHaveBeenCalledWith(QUERY_URL, undefined)
  })
})

describe('takeWindowSummary', () => {
  it('reports peaks, the longest wait and how many requests started', () => {
    const clock = createClock()
    const tracker = createRequestActivityTracker(clock.now)

    const listener = tracker.start(LISTEN_URL, {stream: true})
    clock.advance(300)
    listener.responded()

    const query = tracker.start(QUERY_URL, {stream: false})
    const slowQuery = tracker.start(QUERY_URL, {stream: false})
    clock.advance(200)
    query.responded()
    clock.advance(2000)

    expect(tracker.takeWindowSummary()).toEqual({
      // The slow query is still waiting, 2.2 seconds in
      longestWaitMs: 2200,
      peakInFlight: 3,
      peakOpenStreams: 1,
      peakPendingRequests: 2,
      requestsStarted: 3,
      streamsStarted: 1,
      windowMs: 2500,
    })

    slowQuery.end()
  })

  it('starts each window from what is still open, with fresh counts', () => {
    const clock = createClock()
    const tracker = createRequestActivityTracker(clock.now)

    const listener = tracker.start(LISTEN_URL, {stream: true})
    listener.responded()
    for (let i = 0; i < 4; i++) tracker.start(QUERY_URL, {stream: false}).responded()
    tracker.takeWindowSummary()

    clock.advance(60_000)

    expect(tracker.takeWindowSummary()).toEqual({
      longestWaitMs: 0,
      peakInFlight: 1,
      peakOpenStreams: 1,
      peakPendingRequests: 0,
      requestsStarted: 0,
      streamsStarted: 0,
      windowMs: 60_000,
    })
  })

  it('counts the wait of a request that was aborted before it got a response', () => {
    const clock = createClock()
    const tracker = createRequestActivityTracker(clock.now)

    const request = tracker.start(QUERY_URL, {stream: false})
    clock.advance(45_000)
    request.end()

    expect(tracker.takeWindowSummary()).toMatchObject({
      longestWaitMs: 45_000,
      peakPendingRequests: 1,
    })
    expect(tracker.getSnapshot()).toMatchObject({openStreams: 0, pendingRequests: 0})
  })

  it('ignores responses and ends reported more than once', () => {
    const tracker = createRequestActivityTracker()

    const listener = tracker.start(LISTEN_URL, {stream: true})
    listener.responded()
    listener.responded()
    listener.end()
    listener.end()

    expect(tracker.takeWindowSummary()).toMatchObject({peakOpenStreams: 1})
    expect(tracker.getSnapshot()).toMatchObject({openStreams: 0, pendingRequests: 0})
    expect(tracker.takeWindowSummary()).toMatchObject({peakInFlight: 0})
  })
})
