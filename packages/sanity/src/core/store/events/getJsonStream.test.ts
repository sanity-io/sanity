import {ClientError, isHttpError, ServerError} from '@sanity/client'
import {afterEach, describe, expect, it, vi} from 'vitest'

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
})
