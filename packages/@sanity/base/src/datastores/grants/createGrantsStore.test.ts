import client from 'part:@sanity/base/client'
import {first} from 'rxjs/operators'
import {createGrantsStore} from './createGrantsStore'
import {viewer} from './debug/exampleGrants'

jest.mock('part:@sanity/base/client', () => {
  const mockConfig = {
    useCdn: false,
    projectId: 'mock-project-id',
    dataset: 'mock-data-set',
    apiVersion: '1',
  }

  const mockClient = {
    config: () => mockConfig,
    withConfig: () => mockClient,
    request: jest.fn(() => Promise.resolve(null)),
  }

  return mockClient
})

jest.mock('../user', () => {
  const userStore = {
    getCurrentUser: () => Promise.resolve({id: 'example-user-id'}),
  }

  return userStore
})

describe('checkDocumentPermission', () => {
  it('takes in a permission and document and returns an observable of PermissionCheckResult', async () => {
    ;(client.request as jest.Mock).mockImplementation(() => Promise.resolve(viewer))
    const {checkDocumentPermission} = createGrantsStore()

    await expect(
      checkDocumentPermission('create', {_id: 'example-id', _type: 'book'})
        .pipe(first())
        .toPromise()
    ).resolves.toEqual({
      granted: false,
      reason: 'No matching grants found',
    })

    await expect(
      checkDocumentPermission('read', {_id: 'example-id', _type: 'book'}).pipe(first()).toPromise()
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
