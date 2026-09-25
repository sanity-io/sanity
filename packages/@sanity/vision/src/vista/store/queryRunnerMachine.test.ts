import {type LiveEvent, type RawQueryResponse, type SanityClient} from '@sanity/client'
import {Subject} from 'rxjs'
import {describe, expect, it} from 'vitest'
import {createActor, fromObservable, fromPromise, waitFor} from 'xstate'

import {MAX_HISTORY_ENTRIES, queryRunnerMachine} from './queryRunnerMachine'
import {type QueryRequest} from './types'

interface Deferred {
  request: QueryRequest
  signal: AbortSignal
  resolve: (response: Partial<RawQueryResponse<unknown>>) => void
  reject: (error: unknown) => void
}

function createHarness() {
  const fetches: Deferred[] = []
  const liveEvents = new Subject<LiveEvent>()
  let liveSubscriptions = 0

  const machine = queryRunnerMachine.provide({
    actors: {
      runQuery: fromPromise(
        ({input, signal}: {input: {request: QueryRequest}; signal: AbortSignal}) => {
          return new Promise<RawQueryResponse<unknown>>((resolve, reject) => {
            fetches.push({
              request: input.request,
              signal,
              resolve: (response) =>
                resolve({query: input.request.query, ms: 1, result: null, ...response}),
              reject,
            })
          })
        },
      ),
      liveEvents: fromObservable(() => {
        liveSubscriptions++
        return liveEvents
      }),
    },
  })

  const actor = createActor(machine, {input: {tabId: 'tab-1'}})
  actor.start()

  const request = (overrides: Partial<QueryRequest> = {}): QueryRequest => ({
    client: {} as SanityClient,
    query: '*[_type == "author"]',
    params: {},
    includeSourceMap: false,
    url: 'https://example.api.sanity.io/v2025-02-19/data/query/test?query=*',
    ...overrides,
  })

  return {
    actor,
    fetches,
    liveEvents,
    request,
    liveSubscriptionCount: () => liveSubscriptions,
    snapshot: () => actor.getSnapshot(),
  }
}

describe('queryRunnerMachine', () => {
  it('runs a fetch and records the response, its metadata and a history entry', async () => {
    const harness = createHarness()
    const request = harness.request()

    harness.actor.send({type: 'fetch', request, reason: {type: 'manual'}})
    expect(harness.snapshot().matches({request: 'fetching'})).toBe(true)
    expect(harness.snapshot().context.url).toBe(request.url)
    expect(harness.fetches).toHaveLength(1)

    harness.fetches[0].resolve({
      result: [{_id: 'a'}],
      ms: 12,
      syncTags: ['s1:abc'],
      resultSourceMap: {documents: [], paths: [], mappings: {}},
    })
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'settled'}))

    const {context} = harness.snapshot()
    expect(context.result).toEqual([{_id: 'a'}])
    expect(context.meta).toMatchObject({
      url: request.url,
      ms: 12,
      syncTags: ['s1:abc'],
      payloadBytes: JSON.stringify([{_id: 'a'}]).length,
    })
    expect(context.meta?.resultSourceMap).toEqual({documents: [], paths: [], mappings: {}})
    expect(context.history).toHaveLength(1)
    expect(context.history[0]).toMatchObject({
      reason: {type: 'manual'},
      status: 'ok',
      ms: 12,
    })
  })

  it('records failures and clears the previous result', async () => {
    const harness = createHarness()

    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.fetches[0].resolve({result: 1})
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'settled'}))

    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'shortcut'}})
    harness.fetches[1].reject(new Error('Syntax error'))
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'failed'}))

    const {context} = harness.snapshot()
    expect(context.result).toBeUndefined()
    expect(context.meta).toBeUndefined()
    expect(context.error?.message).toBe('Syntax error')
    expect(context.history.map((entry) => entry.status)).toEqual(['error', 'ok'])
    expect(context.history[0]).toMatchObject({
      reason: {type: 'shortcut'},
      errorMessage: 'Syntax error',
    })
  })

  it('aborts an in-flight fetch when a new one starts', async () => {
    const harness = createHarness()

    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'options'}})

    expect(harness.fetches).toHaveLength(2)
    expect(harness.fetches[0].signal.aborted).toBe(true)
    expect(harness.fetches[1].signal.aborted).toBe(false)

    // The stale response must not land
    harness.fetches[0].resolve({result: 'stale'})
    harness.fetches[1].resolve({result: 'fresh'})
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'settled'}))
    expect(harness.snapshot().context.result).toBe('fresh')
    expect(harness.snapshot().context.history).toHaveLength(1)
  })

  it('keeps the previous response when a fetch is cancelled', async () => {
    const harness = createHarness()

    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.actor.send({type: 'cancel'})
    expect(harness.snapshot().matches({request: 'idle'})).toBe(true)
    expect(harness.fetches[0].signal.aborted).toBe(true)
    // Nothing is shown, so there is nothing for live events to replay either
    expect(harness.snapshot().context.request).toBeUndefined()
    expect(harness.snapshot().context.url).toBeUndefined()

    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.fetches[1].resolve({result: 'kept'})
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'settled'}))

    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.actor.send({type: 'cancel'})
    expect(harness.snapshot().matches({request: 'settled'})).toBe(true)
    expect(harness.snapshot().context.result).toBe('kept')
  })

  it('restores the settled request when a later fetch is cancelled', async () => {
    const harness = createHarness()
    const first = harness.request({query: '*[_type == "a"]', url: 'https://x/a'})
    const second = harness.request({query: '*[_type == "b"]', url: 'https://x/b'})

    harness.actor.send({type: 'fetch', request: first, reason: {type: 'manual'}})
    harness.fetches[0].resolve({result: 'a', syncTags: ['s1:a']})
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'settled'}))

    harness.actor.send({type: 'fetch', request: second, reason: {type: 'manual'}})
    expect(harness.snapshot().context.url).toBe('https://x/b')
    harness.actor.send({type: 'cancel'})

    const {context} = harness.snapshot()
    expect(harness.snapshot().matches({request: 'settled'})).toBe(true)
    expect(context.request).toBe(first)
    expect(context.settledRequest).toBe(first)
    expect(context.url).toBe('https://x/a')

    // A live restart replays the request whose result is shown, not the cancelled one
    harness.actor.send({type: 'live.enable', client: {} as SanityClient})
    harness.liveEvents.next({type: 'restart', id: 'r'})
    expect(harness.fetches[2].request).toBe(first)
  })

  it('clears the response on demand, including the request live events would replay', async () => {
    const harness = createHarness()
    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.fetches[0].resolve({result: 'x', syncTags: ['s1:a']})
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'settled'}))

    harness.actor.send({type: 'clear'})
    const {context} = harness.snapshot()
    expect(harness.snapshot().matches({request: 'idle'})).toBe(true)
    expect(context.result).toBeUndefined()
    expect(context.meta).toBeUndefined()
    expect(context.request).toBeUndefined()
    expect(context.syncTags).toBeUndefined()
    expect(context.history).toHaveLength(1)

    harness.actor.send({type: 'live.enable', client: {} as SanityClient})
    harness.liveEvents.next({type: 'restart', id: 'r'})
    harness.liveEvents.next({type: 'message', id: '1', tags: ['s1:a']})
    expect(harness.fetches).toHaveLength(1)
  })

  it('keeps matching live events on the last successful sync tags after a failed fetch', async () => {
    const harness = createHarness()
    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.fetches[0].resolve({result: 1, syncTags: ['s1:a']})
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'settled'}))

    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.fetches[1].reject(new Error('Syntax error'))
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'failed'}))
    expect(harness.snapshot().context.meta).toBeUndefined()

    harness.actor.send({type: 'live.enable', client: {} as SanityClient})
    harness.liveEvents.next({type: 'message', id: '1', tags: ['s1:other']})
    expect(harness.fetches).toHaveLength(2)
    harness.liveEvents.next({type: 'message', id: '2', tags: ['s1:a']})
    expect(harness.fetches).toHaveLength(3)
    expect(harness.snapshot().context.reason).toEqual({type: 'live', matchedTags: ['s1:a']})
  })

  it('caps the history', async () => {
    const harness = createHarness()
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 3; i++) {
      harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
      harness.fetches[i].resolve({result: i})
      // oxlint-disable-next-line no-await-in-loop -- each fetch must settle before the next one starts
      await waitFor(harness.actor, (snapshot) => snapshot.context.result === i)
    }
    expect(harness.snapshot().context.history).toHaveLength(MAX_HISTORY_ENTRIES)
  })

  it('refetches when a live event carries one of the response sync tags', async () => {
    const harness = createHarness()
    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.fetches[0].resolve({result: 1, syncTags: ['s1:a', 's1:b']})
    await waitFor(harness.actor, (snapshot) => snapshot.matches({request: 'settled'}))

    harness.actor.send({type: 'live.enable', client: {} as SanityClient})
    expect(harness.snapshot().matches({live: 'on'})).toBe(true)
    expect(harness.liveSubscriptionCount()).toBe(1)

    harness.liveEvents.next({type: 'welcome'})
    harness.liveEvents.next({type: 'message', id: '1', tags: ['s1:other']})
    expect(harness.fetches).toHaveLength(1)

    harness.liveEvents.next({type: 'message', id: '2', tags: ['s1:zzz', 's1:b']})
    expect(harness.fetches).toHaveLength(2)
    expect(harness.snapshot().context.reason).toEqual({type: 'live', matchedTags: ['s1:b']})

    harness.fetches[1].resolve({result: 2, syncTags: ['s1:c']})
    await waitFor(harness.actor, (snapshot) => snapshot.context.result === 2)
    expect(harness.snapshot().context.history[0].reason).toEqual({
      type: 'live',
      matchedTags: ['s1:b'],
    })

    // Tags from the newest response are the ones that count now
    harness.liveEvents.next({type: 'message', id: '3', tags: ['s1:b']})
    expect(harness.fetches).toHaveLength(2)
    harness.liveEvents.next({type: 'message', id: '4', tags: ['s1:c']})
    expect(harness.fetches).toHaveLength(3)
  })

  it('refetches on a restart event and ignores events without a prior fetch', () => {
    const harness = createHarness()
    harness.actor.send({type: 'live.enable', client: {} as SanityClient})
    harness.liveEvents.next({type: 'restart', id: 'r'})
    expect(harness.fetches).toHaveLength(0)

    harness.actor.send({type: 'fetch', request: harness.request(), reason: {type: 'manual'}})
    harness.liveEvents.next({type: 'restart', id: 'r'})
    expect(harness.fetches).toHaveLength(2)
    expect(harness.snapshot().context.reason).toEqual({type: 'live', matchedTags: []})
  })

  it('resubscribes when live is re-enabled with a new client and stops when disabled', () => {
    const harness = createHarness()
    harness.actor.send({type: 'live.enable', client: {} as SanityClient})
    harness.actor.send({type: 'live.enable', client: {} as SanityClient})
    expect(harness.liveSubscriptionCount()).toBe(2)

    harness.actor.send({type: 'live.disable'})
    expect(harness.snapshot().matches({live: 'off'})).toBe(true)
    expect(harness.liveEvents.observed).toBe(false)
  })

  it('reports live subscription errors and recovers when re-enabled', () => {
    const harness = createHarness()
    harness.actor.send({type: 'live.enable', client: {} as SanityClient})
    harness.liveEvents.error(new Error('offline'))

    expect(harness.snapshot().matches({live: 'failed'})).toBe(true)
    expect(harness.snapshot().context.liveError?.message).toBe('offline')

    harness.actor.send({type: 'live.disable'})
    expect(harness.snapshot().matches({live: 'off'})).toBe(true)
    expect(harness.snapshot().context.liveError).toBeUndefined()
  })
})
