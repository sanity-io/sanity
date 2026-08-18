import {ClientError, ServerError} from '@sanity/client'
import {act, renderHook} from '@testing-library/react'
import {firstValueFrom, of, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  classifyConfigError,
  classifyRequestError,
  getApiErrorCode,
  isInvalidSessionError,
  parseRetryAfter,
} from '../classify'
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
    // 401 is handled directly by the channel (forced logout when tagged
    // with an invalid-session code, re-thrown otherwise), not classified here
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

describe('classifyConfigError', () => {
  it('classifies project-not-found via attributes.type', () => {
    const err = clientErrorWith({
      statusCode: 404,
      body: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Project with ID "nonexistent" not found',
        attributes: {type: 'project'},
      },
    })
    expect(classifyConfigError(err)).toEqual({type: 'projectNotFound'})
  })

  it('classifies dataset-not-found via the discrete error field', () => {
    const err = clientErrorWith({
      statusCode: 404,
      body: {
        error: 'Dataset not found',
        statusCode: 404,
        message: 'Dataset "nonexistent" not found for project ID "ppsg7ml5"',
      },
    })
    expect(classifyConfigError(err)).toEqual({type: 'datasetNotFound'})
  })

  it('leaves generic 404s (no structured discriminator) unclassified', () => {
    // e.g. a /data 404 or a missing-document 404 — caller-domain.
    expect(classifyConfigError(clientErrorWith({statusCode: 404, body: {}}))).toBeNull()
    expect(
      classifyConfigError(
        clientErrorWith({statusCode: 404, body: {error: 'Not Found', message: 'nope'}}),
      ),
    ).toBeNull()
  })

  it('does not match attributes.type for non-project resources', () => {
    const err = clientErrorWith({
      statusCode: 404,
      body: {message: 'not found', attributes: {type: 'document'}},
    })
    expect(classifyConfigError(err)).toBeNull()
  })

  it('ignores non-404 client errors and non-client errors', () => {
    expect(
      classifyConfigError(
        clientErrorWith({statusCode: 403, body: {attributes: {type: 'project'}}}),
      ),
    ).toBeNull()
    expect(classifyConfigError(new Error('nope'))).toBeNull()
  })
})

describe('isInvalidSessionError', () => {
  it('matches a 401 carrying the SIO-401-AEX code', () => {
    const err = clientErrorWith({
      statusCode: 401,
      body: {error: 'Unauthorized', errorCode: 'SIO-401-AEX'},
    })
    expect(isInvalidSessionError(err)).toBe(true)
  })

  it('matches a 401 carrying the SIO-401-ANF code (session not found)', () => {
    // The API tags a token that resolves to no session at all (revoked,
    // purged, or stale) with SIO-401-ANF and the message "Session not
    // found" — just as invalid as an expired one.
    const err = clientErrorWith({
      statusCode: 401,
      body: {error: 'Unauthorized', errorCode: 'SIO-401-ANF', message: 'Session not found'},
    })
    expect(isInvalidSessionError(err)).toBe(true)
  })

  it('rejects a 401 without the code (resource-level denial)', () => {
    expect(isInvalidSessionError(clientErrorWith({statusCode: 401}))).toBe(false)
    expect(
      isInvalidSessionError(clientErrorWith({statusCode: 401, body: {error: 'Unauthorized'}})),
    ).toBe(false)
  })

  it('rejects non-401s and non-client errors', () => {
    expect(
      isInvalidSessionError(clientErrorWith({statusCode: 403, body: {errorCode: 'SIO-401-AEX'}})),
    ).toBe(false)
    expect(isInvalidSessionError(new Error('nope'))).toBe(false)
  })
})

describe('getApiErrorCode', () => {
  it('reads the errorCode from the response body', () => {
    const err = clientErrorWith({
      statusCode: 401,
      body: {error: 'Unauthorized', errorCode: 'SIO-401-AEX'},
    })
    expect(getApiErrorCode(err)).toBe('SIO-401-AEX')
  })

  it('returns undefined when there is no errorCode', () => {
    expect(getApiErrorCode(clientErrorWith({statusCode: 401, body: {error: 'Unauthorized'}}))).toBe(
      undefined,
    )
  })

  it('returns undefined for non-client errors', () => {
    expect(getApiErrorCode(new Error('nope'))).toBe(undefined)
    expect(getApiErrorCode(undefined)).toBe(undefined)
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
    const expiredSessionError = () =>
      clientErrorWith({statusCode: 401, body: {error: 'Unauthorized', errorCode: 'SIO-401-AEX'}})

    it('claims an expired-session 401 as unauthorized (forced logout follows), tagged with the projectId', async () => {
      // Every endpoint tags session-expiry 401s with `SIO-401-AEX` — that
      // positive signal is what drives the forced logout.
      const channel = createRequestErrorChannel()
      void channel.attempt(() => Promise.reject(expiredSessionError()))
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(await latestClaim(channel)).toMatchObject({
        type: 'unauthorized',
        projectId: 'abc123',
      })
    })

    it('claims a session-not-found 401 (SIO-401-ANF) as unauthorized', async () => {
      const channel = createRequestErrorChannel()
      void channel.attempt(() =>
        Promise.reject(
          clientErrorWith({
            statusCode: 401,
            body: {error: 'Unauthorized', errorCode: 'SIO-401-ANF', message: 'Session not found'},
          }),
        ),
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(await latestClaim(channel)).toMatchObject({
        type: 'unauthorized',
        projectId: 'abc123',
      })
    })

    it('re-throws 401s without an invalid-session code (resource-level denials)', async () => {
      // Some endpoints answer 401 (not 403) for authenticated users lacking
      // a grant — those must stay caller-domain, not force a logout.
      const channel = createRequestErrorChannel()
      const err = clientErrorWith({statusCode: 401})
      await expect(channel.attempt(() => Promise.reject(err))).rejects.toBe(err)
      await expect(Promise.reject(err).catch(channel.handle)).rejects.toBe(err)
      expect(await latestClaim(channel)).toBeUndefined()
    })

    it('parks concurrent expired-session 401s behind a single unauthorized claim', async () => {
      // The first 401 owns the dialog + logout; later 401s for the same
      // teardown (including the logout request re-401ing) park silently.
      const channel = createRequestErrorChannel()
      void channel.attempt(() => Promise.reject(expiredSessionError()))
      void channel.attempt(() => Promise.reject(expiredSessionError()))
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
