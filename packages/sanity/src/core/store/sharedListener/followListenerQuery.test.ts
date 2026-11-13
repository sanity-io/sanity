import {type ReconnectEvent, type WelcomeEvent} from '@sanity/client'
import {defer, Observable, of, Subject, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {mutation, task} from '../addonDatasetListener/__fixtures__/addonDataset.fixture'
import {type AddonDatasetDocument} from '../addonDatasetListener/createAddonDatasetListenerStore'
import {
  followListenerQuery,
  type ListenerQueryEvent,
  type SharedListenerEvent,
} from './followListenerQuery'

const WELCOME: WelcomeEvent = {type: 'welcome', listenerName: 'test'}
const RECONNECT: ReconnectEvent = {type: 'reconnect'}
const LOADING = {type: 'loading'}

/** A fetch that fails its first `failures` attempts, then returns `documents` */
function flakyFetch(failures: number, documents: string[]) {
  const attempts = {count: 0}
  const fetch = defer(() => {
    attempts.count += 1
    return attempts.count <= failures
      ? throwError(() => new Error(`attempt ${attempts.count} failed`))
      : of(documents)
  })
  return {fetch, attempts}
}

/** Follows `fetch` on a listener whose events are sent through `server` */
function follow(fetch: Observable<string[]>) {
  const server = new Subject<SharedListenerEvent<AddonDatasetDocument>>()
  const events: ListenerQueryEvent<string, AddonDatasetDocument>[] = []
  const subscription = server
    .pipe(followListenerQuery(fetch))
    .subscribe((event) => events.push(event))
  return {server, events, subscription}
}

describe('followListenerQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches on every connection, and cancels a fetch still in flight when the listener reconnects', () => {
    const response = new Subject<string[]>()
    const fetches = {started: 0, open: 0}
    const fetch = new Observable<string[]>((subscriber) => {
      fetches.started += 1
      fetches.open += 1
      const subscription = response.subscribe(subscriber)
      return () => {
        fetches.open -= 1
        subscription.unsubscribe()
      }
    })
    const {server, events, subscription} = follow(fetch)

    server.next(WELCOME)
    expect(events).toEqual([LOADING])
    expect(fetches.open).toBe(1)

    server.next(RECONNECT)
    expect(fetches.open).toBe(0)

    server.next(WELCOME)
    response.next(['a'])
    expect(fetches.started).toBe(2)
    expect(events).toEqual([LOADING, LOADING, LOADING, {type: 'loaded', documents: ['a']}])

    subscription.unsubscribe()
  })

  it('retries a failed fetch, waiting longer before each attempt', () => {
    const {fetch, attempts} = flakyFetch(2, ['a'])
    const {server, events, subscription} = follow(fetch)

    server.next(WELCOME)
    expect(attempts.count).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(attempts.count).toBe(2)
    vi.advanceTimersByTime(1999)
    expect(attempts.count).toBe(2)
    vi.advanceTimersByTime(1)

    expect(attempts.count).toBe(3)
    expect(events).toEqual([LOADING, {type: 'loaded', documents: ['a']}])

    subscription.unsubscribe()
  })

  it('reports a fetch that keeps failing once it runs out of retries, and passes on mutations meanwhile', () => {
    const {fetch, attempts} = flakyFetch(Infinity, [])
    const {server, events, subscription} = follow(fetch)
    const appear = mutation('appear', 't-1', task('t-1'))

    server.next(WELCOME)
    server.next(appear)
    vi.advanceTimersByTime(1000 + 2000 + 3000)

    expect(attempts.count).toBe(4)
    expect(events).toEqual([LOADING, appear, {type: 'error', error: new Error('attempt 4 failed')}])

    subscription.unsubscribe()
  })

  it('reports a failed listener', () => {
    const {fetch} = flakyFetch(0, [])
    const {server, events} = follow(fetch)
    const error = new Error('listener failed')

    server.error(error)

    expect(events).toEqual([{type: 'error', error}])
  })
})
