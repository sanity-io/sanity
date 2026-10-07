import {describe, expect, it, vi} from 'vitest'

import {IdleScheduler} from '../idleScheduler'

interface IdleRequest {
  id: number
  callback: IdleRequestCallback
  options: IdleRequestOptions | undefined
}

/** A controllable stand-in for the browser's idle callback queue. */
function createIdleQueue() {
  const requests: IdleRequest[] = []
  let nextId = 1
  const requestIdleCallback = vi.fn(
    (callback: IdleRequestCallback, options?: IdleRequestOptions): number => {
      const id = nextId++
      requests.push({id, callback, options})
      return id
    },
  )
  const cancelIdleCallback = vi.fn((id: number): void => {
    const index = requests.findIndex((request) => request.id === id)
    if (index !== -1) requests.splice(index, 1)
  })
  return {
    requestIdleCallback,
    cancelIdleCallback,
    get pending() {
      return requests.length
    },
    /** Runs the oldest pending request with the given deadline. */
    fire(deadline: {didTimeout?: boolean; timeRemaining: () => number}) {
      const request = requests.shift()
      if (!request) throw new Error('No idle callback is pending')
      request.callback({didTimeout: false, ...deadline})
    },
  }
}

/**
 * A deadline that allows exactly `count` releases. The first release of a slice happens before
 * the deadline is consulted, so `timeRemaining()` reports time left `count - 1` times.
 */
function allowing(count: number) {
  let left = count - 1
  return {timeRemaining: () => (left-- > 0 ? 10 : 0)}
}

function createScheduler(
  queue: ReturnType<typeof createIdleQueue>,
  options: {isDocumentHidden?: () => boolean; now?: () => number} = {},
) {
  return new IdleScheduler({
    requestIdleCallback: queue.requestIdleCallback,
    cancelIdleCallback: queue.cancelIdleCallback,
    ...options,
  })
}

/** Subscribes to a yield and reports whether it has completed. */
function park(scheduler: IdleScheduler) {
  const done = vi.fn()
  const subscription = scheduler.yield().subscribe({complete: done})
  return {done, subscription}
}

describe('IdleScheduler', () => {
  it('requests one idle callback with a timeout for any number of waiting subscribers', () => {
    const queue = createIdleQueue()
    const scheduler = createScheduler(queue)

    const waiting = Array.from({length: 5}, () => park(scheduler))

    expect(queue.requestIdleCallback).toHaveBeenCalledOnce()
    expect(queue.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: expect.any(Number),
    })
    expect(waiting.every(({done}) => !done.mock.calls.length)).toBe(true)
  })

  it('releases waiting work in order while the deadline has time left and parks the rest', () => {
    const queue = createIdleQueue()
    const scheduler = createScheduler(queue)
    const order: number[] = []
    for (let i = 0; i < 5; i++) {
      scheduler.yield().subscribe({complete: () => order.push(i)})
    }

    queue.fire(allowing(2))

    expect(order).toEqual([0, 1])
    expect(queue.pending).toBe(1)

    queue.fire(allowing(10))

    expect(order).toEqual([0, 1, 2, 3, 4])
    expect(queue.pending).toBe(0)
  })

  it('runs work that becomes ready during a slice without another idle period', () => {
    const queue = createIdleQueue()
    const scheduler = createScheduler(queue)
    const nested = vi.fn()
    scheduler.yield().subscribe({
      // mirrors a node that starts its children once it has been granted a turn
      complete: () => scheduler.yield().subscribe({complete: nested}),
    })

    queue.fire({timeRemaining: () => 10})

    expect(nested).toHaveBeenCalledOnce()
    expect(queue.requestIdleCallback).toHaveBeenCalledOnce()
  })

  it('parks work that becomes ready once the slice has run out of time', () => {
    const queue = createIdleQueue()
    const scheduler = createScheduler(queue)
    const nested = vi.fn()
    scheduler.yield().subscribe({
      complete: () => scheduler.yield().subscribe({complete: nested}),
    })

    queue.fire(allowing(0))

    expect(nested).not.toHaveBeenCalled()
    expect(queue.pending).toBe(1)

    queue.fire(allowing(1))

    expect(nested).toHaveBeenCalledOnce()
  })

  it('releases at least one subscriber per idle period even when no time is left', () => {
    const queue = createIdleQueue()
    const scheduler = createScheduler(queue)
    const first = park(scheduler)
    const second = park(scheduler)

    queue.fire({timeRemaining: () => 0})

    expect(first.done).toHaveBeenCalledOnce()
    expect(second.done).not.toHaveBeenCalled()
    expect(queue.pending).toBe(1)
  })

  it('takes a short fixed slice when the idle callback fired because its timeout expired', () => {
    const queue = createIdleQueue()
    let time = 1000
    const scheduler = createScheduler(queue, {now: () => time})
    const released: number[] = []
    for (let i = 0; i < 4; i++) {
      scheduler.yield().subscribe({
        complete: () => {
          released.push(i)
          time += 10
        },
      })
    }

    // a timed-out callback has no idle time; 10ms per task fits one task plus the one in flight
    queue.fire({didTimeout: true, timeRemaining: () => 0})

    expect(released).toEqual([0, 1])
    expect(queue.pending).toBe(1)
  })

  it('runs synchronously without requesting idle callbacks while the document is hidden', () => {
    const queue = createIdleQueue()
    const scheduler = createScheduler(queue, {isDocumentHidden: () => true})

    const {done} = park(scheduler)

    expect(done).toHaveBeenCalledOnce()
    expect(queue.requestIdleCallback).not.toHaveBeenCalled()
  })

  it('stops running inline once a hidden document becomes visible again', () => {
    const queue = createIdleQueue()
    let hidden = false
    const scheduler = createScheduler(queue, {isDocumentHidden: () => hidden})
    const parked = park(scheduler)

    hidden = true
    queue.fire({timeRemaining: () => 0})
    expect(parked.done).toHaveBeenCalledOnce()
    // work that becomes ready while hidden runs inline
    expect(park(scheduler).done).toHaveBeenCalledOnce()

    hidden = false
    const afterVisible = park(scheduler)

    expect(afterVisible.done).not.toHaveBeenCalled()
    expect(queue.pending).toBe(1)
  })

  it('cancels the pending idle callback when every waiting subscriber unsubscribes', () => {
    const queue = createIdleQueue()
    const scheduler = createScheduler(queue)
    const first = park(scheduler)
    const second = park(scheduler)

    first.subscription.unsubscribe()
    expect(queue.cancelIdleCallback).not.toHaveBeenCalled()

    second.subscription.unsubscribe()
    expect(queue.cancelIdleCallback).toHaveBeenCalledOnce()
    expect(queue.pending).toBe(0)
  })

  it('does not cancel pending work when an already released subscriber unsubscribes', () => {
    const queue = createIdleQueue()
    const scheduler = createScheduler(queue)
    const released = park(scheduler)
    const waiting = park(scheduler)

    queue.fire(allowing(1))
    expect(released.done).toHaveBeenCalledOnce()
    released.subscription.unsubscribe()

    expect(queue.cancelIdleCallback).not.toHaveBeenCalled()
    expect(queue.pending).toBe(1)
    queue.fire(allowing(1))
    expect(waiting.done).toHaveBeenCalledOnce()
  })

  it('requests a new idle period for work parked during a slice', () => {
    const queue = createIdleQueue()
    const scheduler = createScheduler(queue)
    const late = vi.fn()
    scheduler.yield().subscribe({
      complete: () => {
        // the budget is gone by the time this nested work asks for a turn
        scheduler.yield().subscribe({complete: late})
      },
    })

    queue.fire({timeRemaining: () => 0})

    expect(late).not.toHaveBeenCalled()
    expect(queue.requestIdleCallback).toHaveBeenCalledTimes(2)
    queue.fire({timeRemaining: () => 0})
    expect(late).toHaveBeenCalledOnce()
  })
})
