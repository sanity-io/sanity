import {ClientError, isHttpError, type RequestHandler, ServerError} from '@sanity/client'
import {filter, firstValueFrom, take} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createRequestErrorChannel} from '../../studio/requestErrors/createRequestErrorChannel'
import {createStudioRequestHandler} from '../../studio/requestErrors/createStudioRequestHandler'
import {isInvalidSessionError} from '../../util/apiErrors'
import {getJsonStream} from './getJsonStream'

const URL = 'https://test.api.sanity.test/v1/data/history/test/transactions/doc1'

async function readAll<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader()
  const items: T[] = []
  for (;;) {
    const result = await reader.read()
    if (result.done) return items
    items.push(result.value)
  }
}

/** Retries an invalid-session rejection once with a renewed token, like the OAuth auth store. */
const renewingRequestHandler: RequestHandler = async (request, next) => {
  try {
    return await next(request)
  } catch (err) {
    if (!isInvalidSessionError(err)) throw err
    const headers = new Headers(request.headers)
    headers.set('authorization', 'Bearer renewed')
    return next({...request, headers})
  }
}

describe('getJsonStream', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('streams NDJSON entries from an OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{"id":"tx1"}\n{"id":"tx2"}\n', {
          headers: {'content-type': 'application/x-ndjson'},
        }),
      ),
    )

    expect(await readAll(await getJsonStream(URL, 'token'))).toEqual([{id: 'tx1'}, {id: 'tx2'}])
  })

  it('throws a client HttpError for a 429, carrying the status, headers and API message', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({error: {type: 'rateLimitError', description: 'Too many requests'}}),
            {status: 429, headers: {'content-type': 'application/json', 'retry-after': '7'}},
          ),
        ),
    )

    const error = await getJsonStream(URL, 'token').catch((err) => err)

    expect(error).toBeInstanceOf(ClientError)
    expect(isHttpError(error)).toBe(true)
    expect(error).toMatchObject({
      statusCode: 429,
      message: 'Too many requests',
      response: {headers: {'retry-after': '7'}, url: URL, method: 'GET'},
    })
  })

  it('throws a ServerError for a 5xx response without a JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('upstream unavailable', {status: 503})),
    )

    const error = await getJsonStream(URL, undefined).catch((err) => err)

    expect(error).toBeInstanceOf(ServerError)
    expect(isHttpError(error)).toBe(true)
    expect(error.statusCode).toBe(503)
    expect(error.message).toContain('HTTP 503')
  })

  it('sends the token as a bearer header, and the cookie without one', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(''))
    vi.stubGlobal('fetch', fetchMock)

    await getJsonStream(URL, 'token')
    await getJsonStream(URL, undefined)

    const [[, withToken], [, withCookie]] = fetchMock.mock.calls
    expect(new Headers(withToken.headers).get('authorization')).toBe('Bearer token')
    expect(withToken.credentials).toBeUndefined()
    expect(new Headers(withCookie.headers).has('authorization')).toBe(false)
    expect(withCookie.credentials).toBe('include')
  })

  it('turns a no-credentials 401 into an invalid-session error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {description: 'Authentication required', type: 'unauthenticatedError'},
          }),
          {status: 401, headers: {'content-type': 'application/json'}},
        ),
      ),
    )

    const error = await getJsonStream(URL, undefined).catch((err) => err)

    expect(error).toBeInstanceOf(ClientError)
    expect(isInvalidSessionError(error)).toBe(true)
    expect(error.message).toBe('Authentication required')
    expect(error.response.body.error).toEqual({
      description: 'Authentication required',
      type: 'unauthenticatedError',
    })
  })

  it('runs the fetch through the request handler, which can retry it with a new token', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      return new Headers(init.headers).get('authorization') === 'Bearer renewed'
        ? new Response('{"id":"tx1"}\n')
        : new Response(
            JSON.stringify({error: 'Unauthorized', errorCode: 'SIO-401-AEX', message: 'Expired'}),
            {status: 401, headers: {'content-type': 'application/json'}},
          )
    })
    vi.stubGlobal('fetch', fetchMock)

    const stream = await getJsonStream(URL, 'expired', renewingRequestHandler)

    expect(await readAll(stream)).toEqual([{id: 'tx1'}])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('stays pending while the studio request handler logs the user out on a no-credentials 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {description: 'Authentication required', type: 'unauthenticatedError'},
          }),
          {status: 401, headers: {'content-type': 'application/json'}},
        ),
      ),
    )
    const channel = createRequestErrorChannel()
    const settled = vi.fn()

    void getJsonStream(URL, undefined, createStudioRequestHandler({channel})).then(settled, settled)

    const claim = await firstValueFrom(
      channel.claim$.pipe(
        filter((current) => current !== undefined),
        take(1),
      ),
    )
    expect(claim).toMatchObject({type: 'unauthorized'})
    expect(settled).not.toHaveBeenCalled()
  })

  it('rejects with a 401 without a session signal, which the studio request handler leaves to the caller', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({error: 'Unauthorized', message: 'Missing grant'}), {
          status: 401,
          headers: {'content-type': 'application/json'},
        }),
      ),
    )
    const channel = createRequestErrorChannel()

    const error = await getJsonStream(URL, 'token', createStudioRequestHandler({channel})).catch(
      (err) => err,
    )

    expect(error).toBeInstanceOf(ClientError)
    expect(isInvalidSessionError(error)).toBe(false)
    expect(error.statusCode).toBe(401)
  })
})
