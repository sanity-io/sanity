import {ClientError, ServerError} from '@sanity/client'
import {act, renderHook} from '@testing-library/react'
import {firstValueFrom, of, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {classifyRequestError, parseRetryAfter} from '../classify'
import {createRequestErrorChannel, passthroughErrorHandler} from '../createRequestErrorChannel'
import {useRetryCountdown} from '../RequestErrorDialog'
import {type RequestErrorClaim} from '../types'

function clientErrorWith(response: Record<string, unknown>): ClientError {
  // ClientError is constructed from a response-like object. We feed it a
  // minimal shape that mirrors what get-it produces.
  return new ClientError({
    statusCode: (response.statusCode as number) ?? 400,
    headers: (response.headers as Record<string, string>) ?? {},
    body: response.body ?? {},
    url: 'https://abc123.api.sanity.io/v1/foo',
    method: 'GET',
    ...response,
  } as never)
}

function serverError(): ServerError {
  return new ServerError({
    statusCode: 503,
    headers: {},
    body: {},
    url: 'https://abc123.api.sanity.io/v1/foo',
    method: 'GET',
  } as never)
}

function networkError(): Error {
  return Object.assign(new Error('Request error while attempting to reach example'), {
    isNetworkError: true,
    request: {url: 'https://abc123.api.sanity.io/v1/foo'},
  })
}

async function latestClaim(
  channel: ReturnType<typeof createRequestErrorChannel>,
): Promise<RequestErrorClaim | undefined> {
  return firstValueFrom(channel.claim$)
}

describe('parseRetryAfter', () => {
  it('returns undefined when header is missing', () => {
    const err = clientErrorWith({statusCode: 429, headers: {}})
    expect(parseRetryAfter(err)).toBeUndefined()
  })

  it('parses delta-seconds form', () => {
    const err = clientErrorWith({statusCode: 429, headers: {'retry-after': '30'}})
    expect(parseRetryAfter(err)).toBe(30)
  })

  it('handles zero delta-seconds', () => {
    const err = clientErrorWith({statusCode: 429, headers: {'retry-after': '0'}})
    expect(parseRetryAfter(err)).toBe(0)
  })

  it('rejects negative delta-seconds', () => {
    const err = clientErrorWith({statusCode: 429, headers: {'retry-after': '-5'}})
    expect(parseRetryAfter(err)).toBeUndefined()
  })

  it('rejects non-numeric, non-date garbage', () => {
    const err = clientErrorWith({statusCode: 429, headers: {'retry-after': 'soon'}})
    expect(parseRetryAfter(err)).toBeUndefined()
  })

  it('parses HTTP-date form and returns seconds from now', () => {
    const future = new Date(Date.now() + 60_000).toUTCString()
    const err = clientErrorWith({statusCode: 429, headers: {'retry-after': future}})
    const seconds = parseRetryAfter(err)
    expect(seconds).toBeGreaterThanOrEqual(59)
    expect(seconds).toBeLessThanOrEqual(61)
  })

  it('clamps past HTTP-date to 0', () => {
    const past = new Date(Date.now() - 60_000).toUTCString()
    const err = clientErrorWith({statusCode: 429, headers: {'retry-after': past}})
    expect(parseRetryAfter(err)).toBe(0)
  })
})

describe('classifyRequestError', () => {
  it('classifies 429 as rateLimited with retry-after', () => {
    const err = clientErrorWith({statusCode: 429, headers: {'retry-after': '12'}})
    expect(classifyRequestError(err)).toMatchObject({type: 'rateLimited', retryAfterSeconds: 12})
  })

  it('leaves caller-domain 4xx unclassified', () => {
    expect(classifyRequestError(clientErrorWith({statusCode: 403}))).toBeNull()
    expect(classifyRequestError(clientErrorWith({statusCode: 404}))).toBeNull()
    // 401 is handled directly by the channel (→ forced logout), not classified here
    expect(classifyRequestError(clientErrorWith({statusCode: 401}))).toBeNull()
  })

  it('classifies 5xx as serverError', () => {
    expect(classifyRequestError(serverError())).toMatchObject({type: 'serverError'})
  })

  it('classifies network errors', () => {
    expect(classifyRequestError(networkError())).toMatchObject({type: 'networkError'})
  })

  it('leaves arbitrary errors unclassified', () => {
    expect(classifyRequestError(new Error('nope'))).toBeNull()
  })
})

describe('createRequestErrorChannel', () => {
  describe('handle()', () => {
    it('re-throws unclaimable errors so downstream catch still sees them', async () => {
      const channel = createRequestErrorChannel()
      const err = clientErrorWith({statusCode: 403})
      await expect(Promise.reject(err).catch(channel.handle)).rejects.toBe(err)
      expect(await latestClaim(channel)).toBeUndefined()
    })

    it('re-throws non-HTTP errors (TypeError, parse errors) unchanged, with no claim', async () => {
      const channel = createRequestErrorChannel()
      const typeError = new TypeError("Cannot read properties of undefined (reading 'foo')")
      await expect(Promise.reject(typeError).catch(channel.handle)).rejects.toBe(typeError)

      const parseError = new SyntaxError('Unexpected token < in JSON at position 0')
      await expect(Promise.reject(parseError).catch(channel.handle)).rejects.toBe(parseError)

      expect(await latestClaim(channel)).toBeUndefined()
    })

    it('claims infra-level errors and leaves the chain pending', async () => {
      const channel = createRequestErrorChannel()
      const pending = Promise.reject(serverError()).catch(channel.handle)
      // Give the (async) claim a tick to land.
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(await latestClaim(channel)).toMatchObject({type: 'serverError', retryable: false})

      // The chain must stay pending — race it against a sentinel.
      const outcome = await Promise.race([
        pending.then(
          () => 'settled',
          () => 'settled',
        ),
        new Promise((resolve) => setTimeout(() => resolve('pending'), 10)),
      ])
      expect(outcome).toBe('pending')
    })
  })

  describe('attempt()', () => {
    it('resolves with the thunk result on success', async () => {
      const channel = createRequestErrorChannel()
      await expect(channel.attempt(() => Promise.resolve('ok'))).resolves.toBe('ok')
    })

    it('accepts a thunk returning an observable (drained to its last value)', async () => {
      const channel = createRequestErrorChannel()
      await expect(channel.attempt(() => of('first', 'last'))).resolves.toBe('last')
      const err = clientErrorWith({statusCode: 404})
      await expect(channel.attempt(() => throwError(() => err))).rejects.toBe(err)
    })

    it('passes the attempt number to the thunk', async () => {
      const channel = createRequestErrorChannel()
      const seen: number[] = []
      const result = channel.attempt(
        (attemptNumber) => {
          seen.push(attemptNumber)
          return attemptNumber === 1 ? Promise.reject(networkError()) : Promise.resolve('done')
        },
        {retryable: true},
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
      channel.retry()
      await expect(result).resolves.toBe('done')
      expect(seen).toEqual([1, 2])
    })

    it('rejects with unclaimable errors', async () => {
      const channel = createRequestErrorChannel()
      const err = clientErrorWith({statusCode: 404})
      await expect(channel.attempt(() => Promise.reject(err))).rejects.toBe(err)
    })

    it('rejects with non-HTTP errors (TypeError, parse errors) and never claims them', async () => {
      const channel = createRequestErrorChannel()
      const typeError = new TypeError('not a function')
      await expect(channel.attempt(() => Promise.reject(typeError))).rejects.toBe(typeError)
      expect(await latestClaim(channel)).toBeUndefined()
    })

    it('claims infra failures; retry() re-invokes the thunk and resolves', async () => {
      const channel = createRequestErrorChannel()
      const thunk = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(networkError())
        .mockResolvedValueOnce('recovered')

      const result = channel.attempt(thunk, {retryable: true})
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(await latestClaim(channel)).toMatchObject({type: 'networkError', retryable: true})

      channel.retry()
      await expect(result).resolves.toBe('recovered')
      expect(thunk).toHaveBeenCalledTimes(2)
      expect(await latestClaim(channel)).toBeUndefined()
    })

    it('produces a fresh claim when the retried attempt fails again', async () => {
      const channel = createRequestErrorChannel()
      const thunk = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(clientErrorWith({statusCode: 429, headers: {'retry-after': '5'}}))
        .mockRejectedValueOnce(clientErrorWith({statusCode: 429, headers: {'retry-after': '9'}}))
        .mockResolvedValueOnce('finally')

      const result = channel.attempt(thunk, {retryable: true})
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(await latestClaim(channel)).toMatchObject({type: 'rateLimited', retryAfterSeconds: 5})

      channel.retry()
      await new Promise((resolve) => setTimeout(resolve, 0))
      // Fresh claim object with the new Retry-After — the dialog countdown
      // resets from this.
      expect(await latestClaim(channel)).toMatchObject({type: 'rateLimited', retryAfterSeconds: 9})

      channel.retry()
      await expect(result).resolves.toBe('finally')
    })
  })

  describe('401 handling', () => {
    it('claims a 401 as unauthorized (forced logout follows), tagged with the projectId', async () => {
      // A 401 means the session is gone — resource denials are 403s, which
      // are caller-domain and never reach here.
      const channel = createRequestErrorChannel()
      const err = clientErrorWith({statusCode: 401})
      void channel.attempt(() => Promise.reject(err))
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(await latestClaim(channel)).toMatchObject({
        type: 'unauthorized',
        projectId: 'abc123',
      })
    })

    it('parks concurrent 401s behind a single unauthorized claim', async () => {
      // The first 401 owns the dialog + logout; later 401s for the same
      // teardown (including the logout request re-401ing) park silently.
      const channel = createRequestErrorChannel()
      void channel.attempt(() => Promise.reject(clientErrorWith({statusCode: 401})))
      void channel.attempt(() => Promise.reject(clientErrorWith({statusCode: 401})))
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(await latestClaim(channel)).toMatchObject({type: 'unauthorized', projectId: 'abc123'})
    })
  })
})

describe('passthroughErrorHandler', () => {
  it('runs the thunk once and resolves with its result', async () => {
    await expect(passthroughErrorHandler.attempt(() => Promise.resolve('ok'))).resolves.toBe('ok')
  })

  it('drains an observable thunk to its last value', async () => {
    await expect(passthroughErrorHandler.attempt(() => of('first', 'last'))).resolves.toBe('last')
  })

  it('rejects with the thunk error — no dialog, no retry', async () => {
    const err = networkError()
    await expect(passthroughErrorHandler.attempt(() => Promise.reject(err))).rejects.toBe(err)
  })

  it('does not retry: the thunk is invoked exactly once', async () => {
    const thunk = vi.fn<() => Promise<string>>().mockRejectedValue(networkError())
    await expect(passthroughErrorHandler.attempt(thunk, {retryable: true})).rejects.toBeDefined()
    expect(thunk).toHaveBeenCalledTimes(1)
  })

  it('handle() re-throws so the caller chain still sees the error', async () => {
    const err = serverError()
    await expect(Promise.reject(err).catch(passthroughErrorHandler.handle)).rejects.toBe(err)
  })
})

describe('useRetryCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down once per second and stops at 0', () => {
    const {result} = renderHook((props) => useRetryCountdown(props), {
      initialProps: {retryAfterSeconds: 3},
    })
    expect(result.current).toBe(3)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe(2)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current).toBe(0)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current).toBe(0)
  })

  it('starts at 0 when no retry-after is available', () => {
    const {result} = renderHook((props) => useRetryCountdown(props), {
      initialProps: {} as {retryAfterSeconds?: number},
    })
    expect(result.current).toBe(0)
  })

  it('resets when a new claim object arrives (consecutive 429s)', () => {
    // Regression: a retried request that gets rate-limited again produces
    // a fresh claim object. The countdown must restart from the new
    // Retry-After instead of staying at 0 with an enabled button.
    const {result, rerender} = renderHook((props) => useRetryCountdown(props), {
      initialProps: {retryAfterSeconds: 2},
    })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current).toBe(0)

    rerender({retryAfterSeconds: 5})
    expect(result.current).toBe(5)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe(4)
  })
})
