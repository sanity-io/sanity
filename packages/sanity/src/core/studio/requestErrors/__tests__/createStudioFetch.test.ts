import {firstValueFrom, take} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createRequestErrorChannel} from '../createRequestErrorChannel'
import {createStudioFetch} from '../createStudioFetch'

describe('createStudioFetch', () => {
  it('claims a tagged invalid-session response', async () => {
    const channel = createRequestErrorChannel()
    const studioFetch = createStudioFetch({
      fetch: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({errorCode: 'SIO-401-ANF'}), {
          status: 401,
          statusText: 'Unauthorized',
          headers: {'content-type': 'application/json'},
        }),
      ),
      channel,
    })

    void studioFetch('https://abc123.api.sanity.io/v1/data/query/test')

    await vi.waitFor(async () => {
      await expect(firstValueFrom(channel.claim$.pipe(take(1)))).resolves.toMatchObject({
        type: 'unauthorized',
        projectId: 'abc123',
      })
    })
  })

  it('returns a caller-domain response without claiming it', async () => {
    const channel = createRequestErrorChannel()
    const response = new Response(JSON.stringify({error: 'Forbidden'}), {
      status: 403,
      statusText: 'Forbidden',
      headers: {'content-type': 'application/json'},
    })
    const studioFetch = createStudioFetch({fetch: vi.fn().mockResolvedValue(response), channel})

    await expect(studioFetch('https://abc123.api.sanity.io/v1/data/query/test')).resolves.toBe(
      response,
    )
    await expect(firstValueFrom(channel.claim$.pipe(take(1)))).resolves.toBeUndefined()
  })
})
