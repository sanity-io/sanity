import {type SanityClient} from '@sanity/client'
import {firstValueFrom, take, toArray} from 'rxjs'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {getShardInfo$} from './getShardInfo'

// The ping observable is memoized for the life of the page, so each case uses
// a URL nothing else has subscribed to.
let pingSequence = 0
function pingUrl(): string {
  pingSequence += 1
  return `https://example.test/data/ping/${pingSequence}`
}

function clientFor(url: string): SanityClient {
  return {
    getDataUrl: () => url,
    getUrl: (path: string) => path,
  } as unknown as SanityClient
}

function shardResponse(shard: string): Response {
  return new Response('pong', {headers: {'X-Sanity-Shard': shard}})
}

describe('getShardInfo$', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('fetches once when two subscribers share a ping URL', async () => {
    const url = pingUrl()
    let resolveFetch: ((response: Response) => void) | undefined
    vi.spyOn(global, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    )

    const first = firstValueFrom(getShardInfo$(clientFor(url)).pipe(take(2), toArray()))
    const second = firstValueFrom(getShardInfo$(clientFor(url)).pipe(take(2), toArray()))

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(url, expect.any(Object))

    resolveFetch?.(shardResponse('shard-a'))

    await expect(first).resolves.toEqual([undefined, 'shard-a'])
    await expect(second).resolves.toEqual([undefined, 'shard-a'])

    await expect(firstValueFrom(getShardInfo$(clientFor(url)))).resolves.toBe('shard-a')
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('fetches again for a different ping URL', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(shardResponse('shard-b'))

    const firstUrl = pingUrl()
    const secondUrl = pingUrl()
    await firstValueFrom(getShardInfo$(clientFor(firstUrl)).pipe(take(2), toArray()))
    await firstValueFrom(getShardInfo$(clientFor(secondUrl)).pipe(take(2), toArray()))

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch).toHaveBeenNthCalledWith(1, firstUrl, expect.any(Object))
    expect(global.fetch).toHaveBeenNthCalledWith(2, secondUrl, expect.any(Object))
  })

  test('emits undefined when the ping fails and does not retry', async () => {
    const url = pingUrl()
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'))

    await expect(
      firstValueFrom(getShardInfo$(clientFor(url)).pipe(take(2), toArray())),
    ).resolves.toEqual([undefined, undefined])

    await expect(firstValueFrom(getShardInfo$(clientFor(url)))).resolves.toBeUndefined()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('emits undefined without fetching when the client cannot build the ping URL', async () => {
    vi.spyOn(global, 'fetch')
    const client = {
      getDataUrl: () => '/data/ping',
      getUrl: () => {
        throw new Error('client not configured')
      },
    } as unknown as SanityClient

    await expect(firstValueFrom(getShardInfo$(client))).resolves.toBeUndefined()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('consumes the ping response body', async () => {
    const response = shardResponse('shard-c')
    const arrayBuffer = vi.spyOn(response, 'arrayBuffer')
    vi.spyOn(global, 'fetch').mockResolvedValue(response)

    await expect(
      firstValueFrom(getShardInfo$(clientFor(pingUrl())).pipe(take(2), toArray())),
    ).resolves.toEqual([undefined, 'shard-c'])
    expect(arrayBuffer).toHaveBeenCalledTimes(1)
  })
})
