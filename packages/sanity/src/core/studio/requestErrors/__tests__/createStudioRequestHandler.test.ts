import {ClientError, createClient, ServerError} from '@sanity/client'
import {filter, firstValueFrom, take} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createRequestErrorChannel} from '../createRequestErrorChannel'
import {createStudioRequestHandler} from '../createStudioRequestHandler'

const request = {
  method: 'GET',
  url: 'https://abc123.api.sanity.io/v1/data/query/test',
}

function responseShape(statusCode: number, body: unknown) {
  return {
    body,
    headers: {'content-type': 'application/json'},
    method: request.method,
    statusCode,
    statusMessage: statusCode === 401 ? 'Unauthorized' : 'Service Unavailable',
    url: request.url,
  }
}

describe('createStudioRequestHandler', () => {
  it('claims a tagged invalid-session error', async () => {
    const channel = createRequestErrorChannel()
    const error = new ClientError(responseShape(401, {errorCode: 'SIO-401-ANF'}))
    const handler = createStudioRequestHandler({channel})

    void handler(request, vi.fn().mockRejectedValue(error))

    await expect(
      firstValueFrom(
        channel.claim$.pipe(
          filter((claim) => claim !== undefined),
          take(1),
        ),
      ),
    ).resolves.toMatchObject({
      type: 'unauthorized',
      projectId: 'abc123',
    })
  })

  it('leaves caller-domain errors unchanged', async () => {
    const channel = createRequestErrorChannel()
    const error = new ClientError(responseShape(403, {error: 'Forbidden'}))
    const handler = createStudioRequestHandler({channel})

    await expect(handler(request, vi.fn().mockRejectedValue(error))).rejects.toBe(error)
    await expect(firstValueFrom(channel.claim$.pipe(take(1)))).resolves.toBeUndefined()
  })

  it('leaves server errors for callers to delegate explicitly', async () => {
    const channel = createRequestErrorChannel()
    const error = new ServerError(responseShape(503, {error: 'Unavailable'}))
    const handler = createStudioRequestHandler({channel})

    await expect(handler(request, vi.fn().mockRejectedValue(error))).rejects.toBe(error)
    await expect(firstValueFrom(channel.claim$.pipe(take(1)))).resolves.toBeUndefined()
  })

  it('retries a request after a diagnosed CORS failure is resolved', async () => {
    const channel = createRequestErrorChannel()
    const client = createClient({
      apiVersion: '2025-02-19',
      dataset: 'test',
      projectId: 'abc123',
      useCdn: false,
    })
    const error = new Error('Failed to fetch')
    const next = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce({result: 'ok'})
    const waitForCorsRetry = vi.fn().mockResolvedValue(undefined)
    const diagnostics = {
      diagnose: vi.fn().mockResolvedValue({type: 'cors', allowed: false, withCredentials: false}),
      onRequestFailure: vi.fn(),
    }
    const handler = createStudioRequestHandler({
      channel,
      diagnostics,
      getClient: () => client,
      waitForCorsRetry,
    })

    await expect(handler(request, next)).resolves.toEqual({result: 'ok'})
    expect(next).toHaveBeenCalledTimes(2)
    expect(diagnostics.onRequestFailure).toHaveBeenCalledOnce()
    expect(waitForCorsRetry).toHaveBeenCalledOnce()
  })
})
