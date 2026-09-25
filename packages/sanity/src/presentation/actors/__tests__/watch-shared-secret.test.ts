import {type LiveEvent} from '@sanity/client'
import {fetchSharedAccessQuery} from '@sanity/preview-url-secret/constants'
import {of, Subject} from 'rxjs'
import {type SanityClient} from 'sanity'
import {describe, expect, test, vi} from 'vitest'
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

  test('stops listening for live events when the actor stops', () => {
    const {client, events} = mockClient('shared-secret')
    const actor = createActor(defineWatchSharedSecretActor({client})).start()
    expect(events.observed).toBe(true)

    actor.stop()
    expect(events.observed).toBe(false)
  })
})
