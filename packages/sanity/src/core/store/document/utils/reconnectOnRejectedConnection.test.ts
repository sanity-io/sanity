import {ConnectionFailedError} from '@sanity/client'
import {defer, type Observable, of, throwError} from 'rxjs'
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

  test('emits reconnect and resubscribes the source with backoff', async () => {
    const {source$, connect} = coldSource([rejected])
    const events: Event[] = []
    const sub = source$.pipe(reconnectOnRejectedConnection()).subscribe((e) => events.push(e))

    await vi.advanceTimersByTimeAsync(0)
    expect(events).toEqual([{type: 'reconnect'}])
    expect(connect).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(connect).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(2_000)
    expect(connect).toHaveBeenCalledTimes(3)

    sub.unsubscribe()
  })

  test('passes other errors through', async () => {
    const error = new Error('channel error')
    const errors: unknown[] = []
    of(1)
      .pipe(() => throwError(() => error), reconnectOnRejectedConnection())
      .subscribe({error: (e) => errors.push(e)})
    expect(errors).toEqual([error])
  })
})
