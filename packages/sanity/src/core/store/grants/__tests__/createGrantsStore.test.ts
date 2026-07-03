import {type SanityClient} from '@sanity/client'
import {firstValueFrom, lastValueFrom} from 'rxjs'
import {first} from 'rxjs/operators'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {type StoreRequestErrorHandler} from '../../requestErrorHandler'
import {viewer} from '../debug/exampleGrants'
import {createGrantsStore} from '../grantsStore'

function createMockClient(data: {requests?: Record<string, any>} = {}): SanityClient {
  const mockConfig = {
    useCdn: false,
    projectId: 'mock-project-id',
    dataset: 'mock-data-set',
    apiVersion: '1',
    url: 'https://mock-project-id.api.sanity.io/v1',
  }

  const requestUriPrefix = `/projects/${mockConfig.projectId}/datasets/${mockConfig.dataset}`

  const mockClient = {
    config: () => mockConfig,
    withConfig: () => mockClient,
    request: vi.fn((opts: {uri: string; tag?: string; withCredentials?: boolean}) => {
      const path = opts.uri.slice(requestUriPrefix.length)

      if (data?.requests?.[path]) {
        return Promise.resolve(data?.requests?.[path])
      }

      return Promise.resolve(data?.requests?.['*'] || null)
    }),
  }

  return mockClient as any
}

describe('checkDocumentPermission', () => {
  it('takes in a permission and document and returns an observable of PermissionCheckResult', async () => {
    const client = createMockClient({
      requests: {
        '/acl': viewer,
      },
    })

    const {checkDocumentPermission} = createGrantsStore({client, userId: null})

    await expect(
      firstValueFrom(checkDocumentPermission('create', {_id: 'example-id', _type: 'book'})),
    ).resolves.toEqual({
      granted: false,
      reason: 'No matching grants found',
    })

    await expect(
      lastValueFrom(
        checkDocumentPermission('read', {_id: 'example-id', _type: 'book'}).pipe(first()),
      ),
    ).resolves.toEqual({
      granted: true,
      reason: 'Matching grant',
    })

    expect((client.request as Mock).mock.calls).toEqual([
      [
        {
          tag: 'acl.get',
          uri: '/projects/mock-project-id/datasets/mock-data-set/acl',
        },
      ],
    ])
  })

  it('delegates request failures to the error handler and recovers when it re-runs the request', async () => {
    const client = createMockClient({
      requests: {
        '/acl': viewer,
      },
    })
    // First attempt fails with a network error; the re-run falls back to
    // the default mock and succeeds.
    const networkError = new Error('Request error while attempting to reach host')
    ;(client.request as Mock).mockRejectedValueOnce(networkError)

    // Ad-hoc handler implementing the recovery contract: re-run a failed
    // retryable request and resolve off the successful attempt.
    const delegated: unknown[] = []
    const errorHandler: StoreRequestErrorHandler = {
      attempt: (thunk, options) =>
        thunk().catch((err) => {
          if (!options?.retryable) throw err
          delegated.push(err)
          return thunk()
        }),
    }

    const {checkDocumentPermission} = createGrantsStore({client, userId: null, errorHandler})

    // The failure is handed to the handler instead of erroring the
    // permission stream; the stream resolves off the re-run request.
    await expect(
      firstValueFrom(checkDocumentPermission('read', {_id: 'example-id', _type: 'book'})),
    ).resolves.toEqual({
      granted: true,
      reason: 'Matching grant',
    })
    expect(delegated).toEqual([networkError])
    expect(client.request).toHaveBeenCalledTimes(2)
  })
})
