import {SanityClient} from '@sanity/client'
import {first} from 'rxjs/operators'
import {firstValueFrom, lastValueFrom} from 'rxjs'
import {createGrantsStore} from '../grantsStore'
import {viewer} from '../debug/exampleGrants'

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
    request: jest.fn((opts: {uri: string; tag?: string; withCredentials: boolean}) => {
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

    const {checkDocumentPermission} = createGrantsStore({client, currentUser: null})

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

    expect((client.request as jest.Mock).mock.calls).toEqual([
      [
        {
          tag: 'acl.get',
          uri: '/projects/mock-project-id/datasets/mock-data-set/acl',
          withCredentials: true,
        },
      ],
    ])
  })
})
