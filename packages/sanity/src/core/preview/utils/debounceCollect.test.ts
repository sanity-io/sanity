import {Observable, of} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {debounceCollect} from './debounceCollect'

const WAIT_MS = 100

describe('debounceCollect', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  /**
   * A batch request that stays open until the test settles it, and records when it is
   * unsubscribed.
   */
  function pendingBatch() {
    const batch = {
      args: [] as [string][][],
      unsubscribed: 0,
      respond: (_values: string[]) => {},
    }
    const fetch = debounceCollect(
      (args: [string][]) =>
        new Observable<string[]>((subscriber) => {
          batch.args.push(args)
          batch.respond = (values) => {
            subscriber.next(values)
            subscriber.complete()
          }
          return () => {
            batch.unsubscribed += 1
          }
        }),
      WAIT_MS,
    )
    return {batch, fetch}
  }

  it('collects the calls made within the wait into one batch, and gives each its result', async () => {
    const fetch = debounceCollect(
      (args: [string][]) => of(args.map(([id]) => id.toUpperCase())),
      WAIT_MS,
    )
    const results: string[] = []
    fetch('a').subscribe((value) => results.push(value))
    fetch('b').subscribe((value) => results.push(value))

    await vi.advanceTimersByTimeAsync(WAIT_MS)

    expect(results).toEqual(['A', 'B'])
  })

  it('unsubscribes from the batch once every caller has unsubscribed', async () => {
    const {batch, fetch} = pendingBatch()
    const first = fetch('a').subscribe()
    const second = fetch('b').subscribe()
    await vi.advanceTimersByTimeAsync(WAIT_MS)
    expect(batch.args).toEqual([[['a'], ['b']]])

    first.unsubscribe()
    expect(batch.unsubscribed).toBe(0)

    second.unsubscribe()
    expect(batch.unsubscribed).toBe(1)
  })

  it('keeps the batch for the callers still subscribed', async () => {
    const {batch, fetch} = pendingBatch()
    const first = fetch('a').subscribe()
    const results: string[] = []
    fetch('b').subscribe((value) => results.push(value))
    await vi.advanceTimersByTimeAsync(WAIT_MS)

    first.unsubscribe()
    batch.respond(['A', 'B'])

    expect(results).toEqual(['B'])
  })

  it('never sends a batch whose callers all unsubscribed before it was due', async () => {
    const {batch, fetch} = pendingBatch()
    fetch('a').subscribe().unsubscribe()

    await vi.advanceTimersByTimeAsync(WAIT_MS)

    expect(batch.args).toEqual([])
  })
})
