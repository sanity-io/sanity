import {ConnectionFailedError} from '@sanity/client'
import {defer, type Observable, of, Subject, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {reconnectOnRejectedConnection} from './reconnectOnRejectedConnection'

type Event = {type: string}

const rejected = () =>
  throwError(() => new ConnectionFailedError('EventSource connection failed', {status: 401}))

// A cold source, like `client.observable.listen()`: each subscription connects
// anew, running the next scripted attempt.
function coldSource(attempts: Array<() => Observable<Event>>) {
  let attempt = 0
  const connect = vi.fn((): Observable<Event> => {
    const next = attempts[Math.min(attempt, attempts.length - 1)]
    attempt++
    return next()
  })
  return {source$: defer(connect), connect}
}

describe('reconnectOnRejectedConnection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('emits reconnect and resubscribes the source with capped exponential backoff', async () => {
    const {source$, connect} = coldSource([rejected])
    const events: Event[] = []
    const sub = source$.pipe(reconnectOnRejectedConnection()).subscribe((e) => events.push(e))

    await vi.advanceTimersByTimeAsync(0)
    expect(events).toEqual([{type: 'reconnect'}])
    expect(connect).toHaveBeenCalledTimes(1)

    // 1s, 2s, 4s, ... up to 30s between attempts
    for (const [delay, attempts] of [
      [1_000, 2],
      [2_000, 3],
      [4_000, 4],
      [8_000, 5],
      [16_000, 6],
      [30_000, 7],
      [30_000, 8],
    ] as const) {
      await vi.advanceTimersByTimeAsync(delay - 1)
      expect(connect).toHaveBeenCalledTimes(attempts - 1)
      await vi.advanceTimersByTimeAsync(1)
      expect(connect).toHaveBeenCalledTimes(attempts)
    }

    sub.unsubscribe()
  })

  test('resets the backoff once a connection succeeds (welcome)', async () => {
    const welcomed$ = new Subject<Event>()
    const {source$, connect} = coldSource([
      rejected, // reject once
      () => welcomed$, // then connect and stay open
    ])
    const sub = source$.pipe(reconnectOnRejectedConnection()).subscribe()

    // First rejection retries after the base delay and connects.
    await vi.advanceTimersByTimeAsync(1_000)
    expect(connect).toHaveBeenCalledTimes(2)
    welcomed$.next({type: 'welcome'})

    // A later rejection starts over at the base delay, not the escalated one.
    welcomed$.error(new ConnectionFailedError('EventSource connection failed', {status: 401}))
    await vi.advanceTimersByTimeAsync(999)
    expect(connect).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(connect).toHaveBeenCalledTimes(3)

    sub.unsubscribe()
  })

  test('the backoff counter is per subscription, not shared', async () => {
    // Two subscriptions to the *same* piped observable over an always-rejecting
    // source. The counter lives in the operator's `defer`, so each subscription
    // gets its own; a shared counter would make the second escalate off the
    // first's progress.
    const {source$, connect} = coldSource([rejected])
    const reconnecting$ = source$.pipe(reconnectOnRejectedConnection())

    // First subscription: connects at 0s, then retries at 1s and 3s. Its next
    // delay would be 4s.
    const first = reconnecting$.subscribe()
    await vi.advanceTimersByTimeAsync(3_000)
    expect(connect).toHaveBeenCalledTimes(3)

    // Second subscription at t=3s: connects immediately, first retry at t=4s
    // (base delay). With a shared counter it would instead wait 8s.
    const second = reconnecting$.subscribe()
    await vi.advanceTimersByTimeAsync(0)
    expect(connect).toHaveBeenCalledTimes(4)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(connect).toHaveBeenCalledTimes(5)

    first.unsubscribe()
    second.unsubscribe()
  })

  test('passes non-connection errors through', () => {
    const error = new Error('channel error')
    const errors: unknown[] = []
    throwError(() => error)
      .pipe(reconnectOnRejectedConnection())
      .subscribe({error: (e) => errors.push(e)})
    expect(errors).toEqual([error])
  })
})
