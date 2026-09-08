import {ClientError, createClient, ServerError} from '@sanity/client'
import {filter, firstValueFrom, take} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {
  createRequestPerformanceTracker,
  studioRequestPerformance,
} from '../../diagnostics/requestPerformance'
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
  it('records to the shared Studio session tracker by default', async () => {
    const channel = createRequestErrorChannel()
    const target = {dataset: 'shared-tracker-test', projectId: 'shared-tracker-test'}
    const client = createClient({
      apiVersion: '2025-02-19',
      ...target,
      useCdn: false,
    })
    const handler = createStudioRequestHandler({channel, getClient: () => client})

    await handler(
      {
        ...request,
        url: `https://${target.projectId}.api.sanity.io/v1/data/query/${target.dataset}`,
      },
      vi.fn().mockResolvedValue({result: 'ok'}),
    )

    expect(studioRequestPerformance.getSnapshot(target)).toMatchObject({
      entries: [expect.objectContaining({bucket: 'query', status: 'success'})],
      totalRequests: 1,
    })
  })

  it('records data request timings without retaining the URL', async () => {
    const channel = createRequestErrorChannel()
    const client = createClient({
      apiVersion: '2025-02-19',
      dataset: 'test',
      projectId: 'abc123',
      useCdn: false,
    })
    const requestPerformance = createRequestPerformanceTracker()
    const handler = createStudioRequestHandler({
      channel,
      getClient: () => client,
      requestPerformance,
    })

    await expect(handler(request, vi.fn().mockResolvedValue({result: 'ok'}))).resolves.toEqual({
      result: 'ok',
    })

    const snapshot = requestPerformance.getSnapshot({dataset: 'test', projectId: 'abc123'})
    expect(snapshot.entries).toHaveLength(1)
    expect(snapshot.entries[0]).toMatchObject({
      apiVersion: 'v1',
      bucket: 'query',
      dataset: 'test',
      projectId: 'abc123',
      status: 'success',
    })
    expect(snapshot.entries[0]).not.toHaveProperty('url')
    expect(snapshot.entries[0]?.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('attributes timings to the target encoded in each request', async () => {
    const channel = createRequestErrorChannel()
    const client = createClient({
      apiVersion: '2025-02-19',
      dataset: 'base-dataset',
      projectId: 'base-project',
      useCdn: false,
    })
    const requestPerformance = createRequestPerformanceTracker()
    const handler = createStudioRequestHandler({
      channel,
      getClient: () => client,
      requestPerformance,
    })

    await handler(
      {
        ...request,
        url: 'https://workspace-project.api.sanity.io/v2025-02-19/data/query/workspace-dataset',
      },
      vi.fn().mockResolvedValue({result: 'ok'}),
    )
    await handler(
      {
        ...request,
        headers: {'X-Sanity-Project-ID': 'header-project'},
        url: 'https://api.sanity.io/v2025-02-19/data/query/header-dataset',
      },
      vi.fn().mockResolvedValue({result: 'ok'}),
    )

    expect(
      requestPerformance.getSnapshot({
        dataset: 'workspace-dataset',
        projectId: 'workspace-project',
      }),
    ).toMatchObject({
      entries: [
        expect.objectContaining({dataset: 'workspace-dataset', projectId: 'workspace-project'}),
      ],
      totalRequests: 1,
    })
    expect(
      requestPerformance.getSnapshot({dataset: 'header-dataset', projectId: 'header-project'}),
    ).toMatchObject({
      entries: [expect.objectContaining({dataset: 'header-dataset', projectId: 'header-project'})],
      totalRequests: 1,
    })
    expect(
      requestPerformance.getSnapshot({dataset: 'base-dataset', projectId: 'base-project'}),
    ).toMatchObject({entries: [], totalRequests: 0})
  })

  it('records aborted requests separately from errors', async () => {
    const channel = createRequestErrorChannel()
    const client = createClient({
      apiVersion: '2025-02-19',
      dataset: 'test',
      projectId: 'abc123',
      useCdn: false,
    })
    const requestPerformance = createRequestPerformanceTracker()
    const abortError = new Error('Request aborted')
    abortError.name = 'AbortError'
    const diagnostics = {
      diagnose: vi.fn(),
      onRequestFailure: vi.fn(),
    }
    const handlerWithDiagnostics = createStudioRequestHandler({
      channel,
      diagnostics,
      getClient: () => client,
      requestPerformance,
    })

    await expect(
      handlerWithDiagnostics(request, vi.fn().mockRejectedValue(abortError)),
    ).rejects.toBe(abortError)

    expect(
      requestPerformance.getSnapshot({dataset: 'test', projectId: 'abc123'}).entries[0],
    ).toMatchObject({status: 'aborted'})
    expect(diagnostics.diagnose).not.toHaveBeenCalled()
    expect(diagnostics.onRequestFailure).not.toHaveBeenCalled()
  })

  it('does not include diagnostics probes in session request performance', async () => {
    const channel = createRequestErrorChannel()
    const client = createClient({
      apiVersion: '2025-02-19',
      dataset: 'test',
      projectId: 'abc123',
      useCdn: false,
    })
    const requestPerformance = createRequestPerformanceTracker()
    const handler = createStudioRequestHandler({
      channel,
      getClient: () => client,
      requestPerformance,
    })

    await handler(
      {...request, query: {tag: 'sanity.studio.diagnostics.query-document'}},
      vi.fn().mockResolvedValue({result: 'ok'}),
    )

    expect(requestPerformance.getSnapshot({dataset: 'test', projectId: 'abc123'})).toMatchObject({
      entries: [],
      totalRequests: 0,
    })
  })

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
    const requestPerformance = createRequestPerformanceTracker()
    const diagnostics = {
      diagnose: vi.fn().mockResolvedValue({type: 'cors', allowed: false, withCredentials: false}),
      onRequestFailure: vi.fn(),
    }
    const handler = createStudioRequestHandler({
      channel,
      diagnostics,
      getClient: () => client,
      requestPerformance,
      waitForCorsRetry,
    })

    await expect(handler(request, next)).resolves.toEqual({result: 'ok'})
    expect(next).toHaveBeenCalledTimes(2)
    expect(diagnostics.onRequestFailure).toHaveBeenCalledOnce()
    expect(waitForCorsRetry).toHaveBeenCalledOnce()
    expect(
      requestPerformance
        .getSnapshot({dataset: 'test', projectId: 'abc123'})
        .entries.map(({status}) => status),
    ).toEqual(['error', 'success'])
  })
})
