import {firstValueFrom, map, type Observable, throwError, timer} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createObservableCache} from '../createObservableCache'

const TTL = 5000
const LATENCY = 10

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

/** A source that completes, like the requests the cache is built for. */
function trackedFetch() {
  let calls = 0
  const fetch = (id: string) => {
    calls++
    return timer(LATENCY).pipe(map(() => `${id}#${calls}`))
  }
  return {fetch, calls: () => calls}
}

/** Subscribe, then let the fake clock run: a cold source starts on subscribe. */
async function read<T>(source: Observable<T>): Promise<T> {
  const value = firstValueFrom(source)
  await vi.advanceTimersByTimeAsync(LATENCY)
  return value
}

describe('createObservableCache', () => {
  it('returns the same observable for the same arguments', () => {
    const cache = createObservableCache((id: string) => timer(LATENCY).pipe(map(() => id)), {
      ttl: TTL,
    })

    expect(cache('a')).toBe(cache('a'))
    expect(cache('a')).not.toBe(cache('b'))
  })

  it('dedupes concurrent subscribers into one request', async () => {
    const {fetch, calls} = trackedFetch()
    const cache = createObservableCache(fetch, {ttl: TTL})
    const user$ = cache('a')

    const first = firstValueFrom(user$)
    const second = firstValueFrom(user$)
    await vi.advanceTimersByTimeAsync(LATENCY)

    expect(await first).toBe('a#1')
    expect(await second).toBe('a#1')
    expect(calls()).toBe(1)
  })

  it('keeps the result while anything subscribes, past the ttl', async () => {
    const {fetch, calls} = trackedFetch()
    const cache = createObservableCache(fetch, {ttl: TTL})
    const user$ = cache('a')
    const subscription = user$.subscribe()

    await vi.advanceTimersByTimeAsync(LATENCY + 10 * TTL)

    expect(cache('a')).toBe(user$)
    expect(await firstValueFrom(user$)).toBe('a#1')
    expect(calls()).toBe(1)
    subscription.unsubscribe()
  })

  it('replays the result until the ttl after its last subscriber left, then refetches', async () => {
    const {fetch, calls} = trackedFetch()
    const cache = createObservableCache(fetch, {ttl: TTL})
    const user$ = cache('a')

    expect(await read(user$)).toBe('a#1')
    await vi.advanceTimersByTimeAsync(TTL - 1)

    // Subscribing again within the ttl replays the result, and leaving restarts the ttl
    expect(await firstValueFrom(user$)).toBe('a#1')
    await vi.advanceTimersByTimeAsync(TTL - 1)
    expect(cache('a')).toBe(user$)
    expect(calls()).toBe(1)

    await vi.advanceTimersByTimeAsync(1)

    expect(cache('a')).not.toBe(user$)
    expect(await read(cache('a'))).toBe('a#2')
    expect(calls()).toBe(2)
  })

  it('finishes a request that lost every subscriber and replays it within the ttl', async () => {
    const {fetch, calls} = trackedFetch()
    const cache = createObservableCache(fetch, {ttl: TTL})

    cache('a').subscribe().unsubscribe()
    await vi.advanceTimersByTimeAsync(LATENCY)

    expect(await read(cache('a'))).toBe('a#1')
    expect(calls()).toBe(1)
  })

  it('releases an entry nothing subscribed to once the ttl has elapsed', async () => {
    const {fetch, calls} = trackedFetch()
    const cache = createObservableCache(fetch, {ttl: TTL})
    const unsubscribed = cache('a')

    await vi.advanceTimersByTimeAsync(TTL - 1)
    expect(cache('a')).toBe(unsubscribed)

    await vi.advanceTimersByTimeAsync(1)
    expect(cache('a')).not.toBe(unsubscribed)
    expect(calls()).toBe(0)
  })

  it('never caches a failure', async () => {
    let attempts = 0
    const cache = createObservableCache(
      () => {
        attempts++
        return throwError(() => new Error('users endpoint is down'))
      },
      {ttl: TTL},
    )

    await expect(firstValueFrom(cache('a'))).rejects.toThrow('users endpoint is down')
    await expect(firstValueFrom(cache('a'))).rejects.toThrow('users endpoint is down')
    expect(attempts).toBe(2)
  })
})
