import {ClientError} from '@sanity/client'
import {lastValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createHistoryRequestQueue} from '../createHistoryRequestQueue'

function rateLimitedError(retryAfter?: string): ClientError {
  return new ClientError({
    statusCode: 429,
    statusMessage: 'Too Many Requests',
    headers: retryAfter === undefined ? {} : {'retry-after': retryAfter},
    body: {},
    url: '/data/history/test/transactions/doc',
    method: 'GET',
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

describe('createHistoryRequestQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs no more than two requests at a time, with a gap after each one', async () => {
    const schedule = createHistoryRequestQueue()
    const pending = Array.from({length: 5}, () => deferred<string>())
    let inFlight = 0
    let maxInFlight = 0
    const started: number[] = []

    const results = pending.map((request, index) =>
      lastValueFrom(
        schedule(async () => {
          started.push(index)
          inFlight += 1
          maxInFlight = Math.max(maxInFlight, inFlight)
          const value = await request.promise
          inFlight -= 1
          return value
        }),
      ),
    )

    await vi.advanceTimersByTimeAsync(0)
    expect(started).toEqual([0, 1])

    pending[0].resolve('first')
    await vi.advanceTimersByTimeAsync(99)
    expect(started).toEqual([0, 1])
    await vi.advanceTimersByTimeAsync(1)
    expect(started).toEqual([0, 1, 2])

    pending.forEach((request, index) => request.resolve(`result ${index}`))
    await vi.advanceTimersByTimeAsync(1000)

    await expect(Promise.all(results)).resolves.toEqual([
      'first',
      'result 1',
      'result 2',
      'result 3',
      'result 4',
    ])
    expect(maxInFlight).toBe(2)
  })

  it('waits for the Retry-After delay before retrying a rate limited request', async () => {
    const schedule = createHistoryRequestQueue()
    const request = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(rateLimitedError('5'))
      .mockResolvedValueOnce('history')

    const result = lastValueFrom(schedule(request))

    await vi.advanceTimersByTimeAsync(4999)
    expect(request).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(request).toHaveBeenCalledTimes(2)
    await expect(result).resolves.toBe('history')
  })

  it('caps the Retry-After delay at a minute', async () => {
    const schedule = createHistoryRequestQueue()
    const request = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(rateLimitedError('3600'))
      .mockResolvedValueOnce('history')

    const result = lastValueFrom(schedule(request))

    await vi.advanceTimersByTimeAsync(60_000)
    expect(request).toHaveBeenCalledTimes(2)
    await expect(result).resolves.toBe('history')
  })

  it('does not retry an error that is not a transient request failure', async () => {
    const schedule = createHistoryRequestQueue()
    const error = new Error('Parse error')
    const request = vi.fn<() => Promise<string>>().mockRejectedValue(error)

    const result = lastValueFrom(schedule(request))
    const settled = expect(result).rejects.toBe(error)
    await vi.advanceTimersByTimeAsync(10_000)

    await settled
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('moves on to the next request after one has failed', async () => {
    const schedule = createHistoryRequestQueue()
    const failing = schedule(() => Promise.reject(new Error('Parse error')))
    const results = [failing, failing, schedule(() => Promise.resolve('history'))].map((request) =>
      lastValueFrom(request).catch((error: Error) => error.message),
    )

    await vi.advanceTimersByTimeAsync(1000)

    await expect(Promise.all(results)).resolves.toEqual(['Parse error', 'Parse error', 'history'])
  })

  it('never sends a request whose subscriber left before its turn', async () => {
    const schedule = createHistoryRequestQueue()
    const blocking = [deferred<string>(), deferred<string>()]
    blocking.forEach((request) => schedule(() => request.promise).subscribe())
    const skipped = vi.fn(() => Promise.resolve('skipped'))
    const sent = vi.fn(() => Promise.resolve('sent'))

    const subscription = schedule(skipped).subscribe()
    const result = lastValueFrom(schedule(sent))
    subscription.unsubscribe()

    blocking.forEach((request) => request.resolve('done'))
    await vi.advanceTimersByTimeAsync(1000)

    await expect(result).resolves.toBe('sent')
    expect(skipped).not.toHaveBeenCalled()
  })

  it('does not wait to retry a request whose subscriber left while it was in flight', async () => {
    const schedule = createHistoryRequestQueue()
    const inFlight = [deferred<string>(), deferred<string>()]
    const subscriptions = inFlight.map((request) => schedule(() => request.promise).subscribe())
    const next = vi.fn(() => Promise.resolve('next'))
    const result = lastValueFrom(schedule(next))

    await vi.advanceTimersByTimeAsync(0)
    subscriptions.forEach((subscription) => subscription.unsubscribe())
    inFlight.forEach((request) => request.reject(rateLimitedError('30')))
    await vi.advanceTimersByTimeAsync(100)

    expect(next).toHaveBeenCalledTimes(1)
    await expect(result).resolves.toBe('next')
  })

  it('stops waiting to retry once its subscriber has left', async () => {
    const schedule = createHistoryRequestQueue()
    const rateLimited = vi.fn(() => Promise.reject(rateLimitedError('30')))
    const subscription = schedule(rateLimited).subscribe()
    const second = schedule(() => Promise.reject(rateLimitedError('30'))).subscribe()
    const next = vi.fn(() => Promise.resolve('next'))
    const result = lastValueFrom(schedule(next))

    await vi.advanceTimersByTimeAsync(0)
    subscription.unsubscribe()
    second.unsubscribe()
    await vi.advanceTimersByTimeAsync(100)

    expect(next).toHaveBeenCalledTimes(1)
    await expect(result).resolves.toBe('next')
    expect(rateLimited).toHaveBeenCalledTimes(1)
  })
})
