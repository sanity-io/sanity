import {type SanityClient} from '@sanity/client'
import {defer, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {LISTENER_RESET_DELAY} from '../../../preview/constants'
import {createGlobalListenerStore} from '../../../store/globalListener/createGlobalListenerStore'
import {createVariantsStore} from '../../../variants/store/createVariantsStore'
import {activeASAPRelease, activeScheduledRelease} from '../../__fixtures__/release.fixture'
import {createReleaseStore} from '../createReleaseStore'
import {type ReleasesReducerState} from '../reducer'

type ListenerEvent =
  | {type: 'welcome'}
  | {type: 'mutation'; documentId: string; transition: 'update'; visibility: 'query'}

function createMockClient() {
  const listener$ = new Subject<ListenerEvent>()
  /** The query of every listener connection opened, in order */
  const connections: string[] = []
  const fetch = vi.fn(() => of<unknown[]>([]))
  const client = {
    listen: (query: string) =>
      defer(() => {
        connections.push(query)
        return listener$
      }),
    withConfig: () => client,
    observable: {fetch},
  } as unknown as SanityClient

  return {client, fetch, connections, listener$}
}

function mutation(documentId: string): ListenerEvent {
  return {type: 'mutation', documentId, transition: 'update', visibility: 'query'}
}

async function flushScheduled() {
  // exhaustMapWithTrailing schedules work on RxJS asyncScheduler (setInterval(0)).
  // Fake timers only flush that work once the clock moves.
  await vi.advanceTimersByTimeAsync(1)
}

/**
 * `state$` holds the global listener for its own grace, and the global listener then holds the
 * socket for {@link LISTENER_RESET_DELAY}. The connection is gone only after both have elapsed.
 */
const LISTENER_RELEASE_DELAY = 5_000 + LISTENER_RESET_DELAY

describe('createReleaseStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the releases once the global listener connects, and reloads them when a release changes', async () => {
    const {client, fetch, listener$} = createMockClient()
    fetch
      .mockReturnValueOnce(of([activeASAPRelease]))
      .mockReturnValueOnce(of([activeASAPRelease, activeScheduledRelease]))
    const store = createReleaseStore({
      client,
      globalListenerStore: createGlobalListenerStore({client}),
    })
    const states: ReleasesReducerState[] = []
    const subscription = store.state$.subscribe((state) => states.push(state))

    listener$.next({type: 'welcome'})
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('_id in path("_.releases.*")'),
      {},
      expect.objectContaining({filterResponse: true, tag: 'releases.store.fetch'}),
    )
    expect(states.at(-1)?.state).toBe('loaded')
    expect(Array.from(states.at(-1)!.releases.values())).toEqual([activeASAPRelease])

    // Documents in a release, and other system documents, do not change the list of releases
    listener$.next(mutation(`versions.${activeASAPRelease.name}.article`))
    listener$.next(mutation('_.variants.alpha'))
    await vi.advanceTimersByTimeAsync(2000)
    expect(fetch).toHaveBeenCalledTimes(1)

    listener$.next(mutation(activeScheduledRelease._id))
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(Array.from(states.at(-1)!.releases.values())).toEqual([
      activeASAPRelease,
      activeScheduledRelease,
    ])

    subscription.unsubscribe()
  })

  it('shares one listener connection with the variants store', async () => {
    const {client, fetch, connections, listener$} = createMockClient()
    const globalListenerStore = createGlobalListenerStore({client})
    const releaseStore = createReleaseStore({client, globalListenerStore})
    const variantsStore = createVariantsStore({client, globalListenerStore, enabled: true})
    const subscriptions = [releaseStore.state$.subscribe(), variantsStore.state$.subscribe()]

    listener$.next({type: 'welcome'})
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(connections).toEqual(['*'])

    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })

  it('keeps the listener through a brief resubscribe and releases it once nobody is left', async () => {
    const {client, connections, listener$} = createMockClient()
    const store = createReleaseStore({
      client,
      globalListenerStore: createGlobalListenerStore({client}),
    })

    const first = store.state$.subscribe()
    listener$.next({type: 'welcome'})
    await flushScheduled()
    expect(listener$.observed).toBe(true)

    // A consumer that remounts within the grace period finds the same listener
    first.unsubscribe()
    await vi.advanceTimersByTimeAsync(1000)
    const second = store.state$.subscribe()
    expect(connections).toEqual(['*'])

    // A workspace that was switched away from has no consumer left, so its
    // listener must not outlive the store's grace plus the global listener's
    second.unsubscribe()
    await vi.advanceTimersByTimeAsync(LISTENER_RELEASE_DELAY - 1)
    expect(listener$.observed).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    expect(listener$.observed).toBe(false)
  })
})
