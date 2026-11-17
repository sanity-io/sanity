import {describe, expect, it, vi} from 'vitest'

import {getRetryDelayMs, withRateLimitRetry} from './rateLimitRetry'

function httpError(statusCode: number, headers: Record<string, string> = {}) {
  return Object.assign(new Error(`HTTP ${statusCode}`), {response: {headers}, statusCode})
}

describe('getRetryDelayMs', () => {
  it('honors Retry-After for rate limits and backs off exponentially without it', () => {
    expect(getRetryDelayMs(httpError(429, {'retry-after': '5'}), 0)).toBe(5_000)
    expect(getRetryDelayMs(httpError(429), 0)).toBe(5_000)
    expect(getRetryDelayMs(httpError(429), 2)).toBe(20_000)
    expect(getRetryDelayMs(httpError(503), 5)).toBe(60_000)
    expect(getRetryDelayMs(httpError(429, {'retry-after': '600'}), 0)).toBe(60_000)
  })

  it('does not retry client errors, network errors, or non-errors', () => {
    expect(getRetryDelayMs(httpError(401), 0)).toBeUndefined()
    expect(getRetryDelayMs(httpError(404), 0)).toBeUndefined()
    expect(getRetryDelayMs(new Error('ECONNRESET'), 0)).toBeUndefined()
    expect(getRetryDelayMs(undefined, 0)).toBeUndefined()
  })
})

describe('withRateLimitRetry', () => {
  it('retries a rate-limited operation until it succeeds, waiting as instructed', async () => {
    const sleep = vi.fn<(ms: number) => Promise<void>>(async () => undefined)
    const log = vi.fn<(message: string) => void>()
    const operation = vi
      .fn()
      .mockRejectedValueOnce(httpError(429, {'retry-after': '5'}))
      .mockRejectedValueOnce(httpError(429))
      .mockResolvedValue('created')

    await expect(withRateLimitRetry('Creating dataset', operation, {log, sleep})).resolves.toBe(
      'created',
    )

    expect(operation).toHaveBeenCalledTimes(3)
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([5_000, 10_000])
    expect(log.mock.calls.map(([message]) => message)).toEqual([
      'Creating dataset: HTTP 429, retrying in 5s (attempt 2 of 6)',
      'Creating dataset: HTTP 429, retrying in 10s (attempt 3 of 6)',
    ])
  })

  it('gives up after the maximum number of attempts', async () => {
    const operation = vi.fn().mockRejectedValue(httpError(429))

    await expect(
      withRateLimitRetry('Listing datasets', operation, {
        log: vi.fn(),
        maxAttempts: 3,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow('HTTP 429')
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('rethrows other failures immediately', async () => {
    const operation = vi.fn().mockRejectedValue(httpError(401))
    const sleep = vi.fn(async () => undefined)

    await expect(withRateLimitRetry('Listing datasets', operation, {sleep})).rejects.toThrow(
      'HTTP 401',
    )
    expect(operation).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })
})
