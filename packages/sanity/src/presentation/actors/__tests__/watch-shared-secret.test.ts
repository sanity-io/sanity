import {type LiveEvent, type RawQueryResponse} from '@sanity/client'
import {fetchSharedAccessQuery} from '@sanity/preview-url-secret/constants'
import {of, Subject} from 'rxjs'
import {type SanityClient} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {createActor} from 'xstate'

import {defineWatchSharedSecretActor} from '../watch-shared-secret'

const shareAccessSyncTag = 's1:share-access'

/**
 * Each read of the shared secret returns the next of `results`
 */
const mockClient = (...results: (string | null)[]) => {
  const events = new Subject<LiveEvent>()
  const fetch = vi.fn(() =>
    of({
      query: fetchSharedAccessQuery,
      ms: 0,
      result: results.shift() ?? null,
      syncTags: [shareAccessSyncTag],
    }),
  )
  const client = {live: {events: () => events}, observable: {fetch}} as unknown as SanityClient
  return {client, events, fetch}
}

/**
 * Each read of the shared secret stays in flight until `respond` is called for it
 */
const mockClientWithPendingReads = () => {
  const events = new Subject<LiveEvent>()
  const reads: Subject<RawQueryResponse<string | null>>[] = []
  const fetch = vi.fn(() => {
    const read = new Subject<RawQueryResponse<string | null>>()
    reads.push(read)
    return read
  })
  const respond = (index: number, result: string | null) => {
    reads[index].next({
      query: fetchSharedAccessQuery,
      ms: 0,
      result,
      syncTags: [shareAccessSyncTag],
    })
    reads[index].complete()
  }
  const client = {live: {events: () => events}, observable: {fetch}} as unknown as SanityClient
  return {client, events, fetch, respond}
}

describe('watch shared preview secret actor', () => {
  test('reads the shared secret, and reads it again when a live event says it changed', () => {
    const {client, events, fetch} = mockClient('shared-secret', null, 'new-shared-secret')
    const actor = createActor(defineWatchSharedSecretActor({client})).start()

    expect(actor.getSnapshot().context).toBe('shared-secret')
    expect(fetch).toHaveBeenLastCalledWith(
      fetchSharedAccessQuery,
      {},
      expect.objectContaining({filterResponse: false, lastLiveEventId: undefined}),
    )

    /**
     * Sharing is turned off
     */
    events.next({type: 'message', id: 'event-1', tags: [shareAccessSyncTag]})
    expect(actor.getSnapshot().context).toBeNull()
    expect(fetch).toHaveBeenLastCalledWith(
      fetchSharedAccessQuery,
      {},
      expect.objectContaining({lastLiveEventId: 'event-1'}),
    )

    /**
     * And back on, with a new secret
     */
    events.next({type: 'message', id: 'event-2', tags: [shareAccessSyncTag]})
    expect(actor.getSnapshot().context).toBe('new-shared-secret')
  })

  test('reads the shared secret again for a live event that arrived during the first read', () => {
    const {client, events, fetch, respond} = mockClientWithPendingReads()
    const actor = createActor(defineWatchSharedSecretActor({client})).start()
    expect(fetch).toHaveBeenCalledTimes(1)

    /**
     * Sharing is turned off while the first read is in flight, and that read still has the secret.
     * Its sync tags aren't known yet, so the event can only be matched once it's done.
     */
    events.next({type: 'message', id: 'event-1', tags: [shareAccessSyncTag]})
    expect(fetch).toHaveBeenCalledTimes(1)
    respond(0, 'shared-secret')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenLastCalledWith(
      fetchSharedAccessQuery,
      {},
      expect.objectContaining({lastLiveEventId: 'event-1'}),
    )

    respond(1, null)
    expect(actor.getSnapshot().context).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('does not let the result of a read overtake the result of the read it starts', () => {
    const events = new Subject<LiveEvent>()
    const firstRead = new Subject<RawQueryResponse<string | null>>()
    const fetch = vi
      .fn()
      .mockReturnValueOnce(firstRead)
      .mockReturnValue(
        of({query: fetchSharedAccessQuery, ms: 0, result: null, syncTags: [shareAccessSyncTag]}),
      )
    const client = {live: {events: () => events}, observable: {fetch}} as unknown as SanityClient
    const actor = createActor(defineWatchSharedSecretActor({client})).start()

    events.next({type: 'message', id: 'event-1', tags: [shareAccessSyncTag]})
    firstRead.next({
      query: fetchSharedAccessQuery,
      ms: 0,
      result: 'shared-secret',
      syncTags: [shareAccessSyncTag],
    })

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(actor.getSnapshot().context).toBeNull()
  })

  test('forgets the live events from before a restart, and reads from scratch once for each reset', () => {
    const {client, events, fetch, respond} = mockClientWithPendingReads()
    const actor = createActor(defineWatchSharedSecretActor({client})).start()

    /**
     * A live event arrives during the first read, and then the stream restarts, so its id no longer applies
     */
    events.next({type: 'message', id: 'event-1', tags: [shareAccessSyncTag]})
    events.next({type: 'restart', id: 'restart-1'})
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenLastCalledWith(
      fetchSharedAccessQuery,
      {},
      expect.objectContaining({lastLiveEventId: undefined}),
    )
    respond(1, 'shared-secret')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(actor.getSnapshot().context).toBe('shared-secret')

    events.next({type: 'reconnect'})
    expect(fetch).toHaveBeenCalledTimes(3)
    respond(2, 'shared-secret')
    expect(fetch).toHaveBeenCalledTimes(3)

    /**
     * Live events on the new stream are matched as before
     */
    events.next({type: 'message', id: 'event-2', tags: [shareAccessSyncTag]})
    expect(fetch).toHaveBeenCalledTimes(4)
    expect(fetch).toHaveBeenLastCalledWith(
      fetchSharedAccessQuery,
      {},
      expect.objectContaining({lastLiveEventId: 'event-2'}),
    )
  })

  test('ignores live events about other documents', () => {
    const {client, events, fetch} = mockClient('shared-secret')
    const actor = createActor(defineWatchSharedSecretActor({client})).start()

    events.next({type: 'welcome'})
    events.next({type: 'message', id: 'event-1', tags: ['s1:another-document']})
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(actor.getSnapshot().context).toBe('shared-secret')
  })

  test.each<LiveEvent>([{type: 'restart', id: 'event-1'}, {type: 'reconnect'}])(
    'reads the shared secret again after a $type, as changes might have been missed',
    (event) => {
      const {client, events, fetch} = mockClient('shared-secret', 'new-shared-secret')
      const actor = createActor(defineWatchSharedSecretActor({client})).start()

      events.next(event)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(actor.getSnapshot().context).toBe('new-shared-secret')
    },
  )

  describe('once the live events connection goes away', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    test('reads the shared secret right away, and then every 30 seconds', () => {
      const {client, events, fetch} = mockClient('shared-secret', 'shared-secret', null)
      const actor = createActor(defineWatchSharedSecretActor({client})).start()

      events.next({type: 'goaway', id: 'event-1', reason: 'Too many connections'})
      expect(events.observed).toBe(false)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenLastCalledWith(
        fetchSharedAccessQuery,
        {},
        expect.objectContaining({lastLiveEventId: undefined}),
      )

      /**
       * Sharing is turned off in the meantime
       */
      vi.advanceTimersByTime(29_999)
      expect(fetch).toHaveBeenCalledTimes(2)
      vi.advanceTimersByTime(1)
      expect(fetch).toHaveBeenCalledTimes(3)
      expect(actor.getSnapshot().context).toBeNull()
    })
  })

  test('stops listening for live events when the actor stops', () => {
    const {client, events} = mockClient('shared-secret')
    const actor = createActor(defineWatchSharedSecretActor({client})).start()
    expect(events.observed).toBe(true)

    actor.stop()
    expect(events.observed).toBe(false)
  })
})
