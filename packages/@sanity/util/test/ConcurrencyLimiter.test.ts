import {describe, expect, it, vi} from 'vitest'

import {ConcurrencyLimiter} from '../src/concurrency-limiter'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('ConcurrencyLimiter', () => {
  it('keeps track of inflight operations and prevents more than the max concurrency at a time', async () => {
    const limiter = new ConcurrencyLimiter(2)

    const promise1Cb = vi.fn()
    const promise2Cb = vi.fn()
    const promise3Cb = vi.fn()
    const promise4Cb = vi.fn()

    const allDone = Promise.all([
      limiter.ready().then(promise1Cb),
      limiter.ready().then(promise2Cb),
      limiter.ready().then(promise3Cb),
      limiter.ready().then(promise4Cb),
    ])
    await tick()

    expect(promise1Cb).toHaveBeenCalled()
    expect(promise2Cb).toHaveBeenCalled()
    expect(promise3Cb).not.toHaveBeenCalled()
    expect(promise4Cb).not.toHaveBeenCalled()

    limiter.release()
    await tick()

    expect(promise3Cb).toHaveBeenCalled()
    expect(promise4Cb).not.toHaveBeenCalled()

    limiter.release()
    await tick()

    expect(promise4Cb).toHaveBeenCalled()

    await allDone
  })

  it('removes aborted waiters without consuming a concurrency slot', async () => {
    const limiter = new ConcurrencyLimiter(1)
    const controller = new AbortController()
    const reason = new Error('cancelled')

    await limiter.ready()
    const queued = limiter.ready(controller.signal)
    controller.abort(reason)

    await expect(queued).rejects.toBe(reason)
    limiter.release()

    await expect(limiter.ready()).resolves.toBeUndefined()
    limiter.release()
  })

  it('preserves FIFO order when a queued operation is aborted', async () => {
    const limiter = new ConcurrencyLimiter(1)
    const controller = new AbortController()
    const reason = new Error('cancelled')
    const order: string[] = []

    await limiter.ready()
    order.push('first')
    const cancelled = limiter.ready(controller.signal).then(() => order.push('cancelled'))
    const third = limiter.ready().then(() => order.push('third'))
    const fourth = limiter.ready().then(() => order.push('fourth'))

    controller.abort(reason)
    await expect(cancelled).rejects.toBe(reason)

    limiter.release()
    await third
    limiter.release()
    await fourth
    limiter.release()

    expect(order).toEqual(['first', 'third', 'fourth'])
  })

  it('releases a slot after an operation rejects', async () => {
    const limiter = new ConcurrencyLimiter(1)
    const error = new Error('failed')

    await expect(limiter.run(() => Promise.reject(error))).rejects.toBe(error)
    await expect(limiter.run(() => 'next')).resolves.toBe('next')
  })

  it('releases a slot when starting an operation throws', async () => {
    const limiter = new ConcurrencyLimiter(1)
    const error = new Error('failed')

    await expect(
      limiter.run(() => {
        throw error
      }),
    ).rejects.toBe(error)
    await expect(limiter.run(() => 'next')).resolves.toBe('next')
  })
})
