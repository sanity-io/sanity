import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type RevertDocument} from '../../tool/components/releaseCTAButtons/ReleaseRevertButton/useDocumentRevertStates'
import {createReleaseOperationsStore} from '../createReleaseOperationStore'
import {type ReleaseDocument} from '../types'

describe('createReleaseOperationsStore', () => {
  let mockClient: any

  beforeEach(() => {
    mockClient = {
      config: vi.fn().mockReturnValue({dataset: 'test-dataset'}),
      request: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
      getDocument: vi.fn(),
    }
  })

  const createStore = () =>
    createReleaseOperationsStore({
      client: mockClient,
      onReleaseLimitReached: vi.fn(),
    })

  it('should create a release', async () => {
    const store = createStore()
    const release = {_id: '_.releases.release-id', metadata: {title: 'Test Release'}}
    await store.createRelease(release)
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.create',
            releaseId: 'release-id',
            metadata: release.metadata,
          },
        ],
      },
    })
  })

  it('should update a release', async () => {
    const store = createStore()
    const release = {_id: '_.releases.release-id', metadata: {title: 'Updated Title'}}
    await store.updateRelease(release)
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.edit',
            releaseId: 'release-id',
            patch: {
              set: {metadata: release.metadata},
              unset: [],
            },
          },
        ],
      },
    })
  })

  it('should publish a release using new publish', async () => {
    const store = createStore()
    await store.publishRelease('_.releases.release-id', true)
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.publish2',
            releaseId: 'release-id',
          },
        ],
      },
    })
  })

  it('should publish a release using stable publish', async () => {
    const store = createStore()
    await store.publishRelease('_.releases.release-id', false)
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.publish',
            releaseId: 'release-id',
          },
        ],
      },
    })
  })

  it('should schedule a release', async () => {
    const store = createStore()
    const date = new Date('2024-01-01T00:00:00Z')
    await store.schedule('_.releases.release-id', date)
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.schedule',
            releaseId: 'release-id',
            publishAt: date.toISOString(),
          },
        ],
      },
    })
  })

  it('should unschedule a release', async () => {
    const store = createStore()
    await store.unschedule('_.releases.release-id')
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.unschedule',
            releaseId: 'release-id',
          },
        ],
      },
    })
  })

  it('should archive a release', async () => {
    const store = createStore()
    await store.archive('_.releases.release-id')
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.archive',
            releaseId: 'release-id',
          },
        ],
      },
    })
  })

  it('should unarchive a release', async () => {
    const store = createStore()
    await store.unarchive('_.releases.release-id')
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.unarchive',
            releaseId: 'release-id',
          },
        ],
      },
    })
  })

  it('should delete a release', async () => {
    const store = createStore()
    await store.deleteRelease('_.releases.release-id')
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.delete',
            releaseId: 'release-id',
          },
        ],
      },
    })
  })

  describe('revertRelease', () => {
    let store: ReturnType<typeof createStore>
    const revertReleaseId: string = 'revert-release-id'
    const revertReleaseDocumentId: string = '_.releases.revert-release-id'
    let releaseDocuments: RevertDocument[]
    let releaseMetadata: ReleaseDocument['metadata']

    beforeEach(() => {
      store = createStore()
      releaseDocuments = [{_id: 'doc1'}, {_id: 'doc2'}] as RevertDocument[]
      releaseMetadata = {
        title: 'Revert Release',
        description: 'A reverted release',
      } as ReleaseDocument['metadata']
    })

    it('should create a new release and publish immediately when revertType is "immediate"', async () => {
      await store.revertRelease(
        revertReleaseDocumentId,
        releaseDocuments,
        releaseMetadata,
        'immediate',
      )

      expect(mockClient.request).toHaveBeenCalledWith({
        uri: '/data/actions/test-dataset',
        method: 'POST',
        body: {
          actions: [
            {
              actionType: 'sanity.action.release.create',
              releaseId: revertReleaseId,
              metadata: {...releaseMetadata, releaseType: 'asap'},
            },
          ],
        },
      })

      expect(mockClient.create).toHaveBeenNthCalledWith(
        1,
        {
          _id: `versions.${revertReleaseId}.doc1`,
        },
        undefined,
      )
      expect(mockClient.create).toHaveBeenNthCalledWith(
        2,
        {
          _id: `versions.${revertReleaseId}.doc2`,
        },
        undefined,
      )

      expect(mockClient.request).toHaveBeenCalledWith({
        uri: '/data/actions/test-dataset',
        method: 'POST',
        body: {
          actions: [
            {
              actionType: 'sanity.action.release.publish',
              releaseId: 'revert-release-id',
            },
          ],
        },
      })
    })

    it('should create a new release without publishing when revertType is "staged"', async () => {
      await store.revertRelease(
        revertReleaseDocumentId,
        releaseDocuments,
        releaseMetadata,
        'staged',
      )

      expect(mockClient.request).toHaveBeenCalledWith({
        uri: '/data/actions/test-dataset',
        method: 'POST',
        body: {
          actions: [
            {
              actionType: 'sanity.action.release.create',
              releaseId: revertReleaseId,
              metadata: {...releaseMetadata, releaseType: 'asap'},
            },
          ],
        },
      })

      expect(mockClient.create).toHaveBeenCalledTimes(2)
      expect(mockClient.request).toHaveBeenCalledTimes(1)
    })

    it('should fail if a document does not exist and no initial value is provided', async () => {
      mockClient.getDocument.mockResolvedValueOnce(null) // Simulate a missing document

      await expect(
        store.revertRelease(
          revertReleaseDocumentId,
          [{_id: 'missing-doc'}] as RevertDocument[],
          releaseMetadata,
          'staged',
        ),
      ).resolves.toBeUndefined()
    })

    it('should handle partial failure gracefully when creating versions', async () => {
      mockClient.create.mockRejectedValueOnce(new Error('Failed to create version'))

      const result = await store.revertRelease(
        revertReleaseDocumentId,
        releaseDocuments,
        releaseMetadata,
        'staged',
      )

      expect(result).toBeUndefined()
      expect(mockClient.create).toHaveBeenCalledTimes(2)
      expect(mockClient.create).toHaveBeenNthCalledWith(
        1,
        {
          _id: `versions.${revertReleaseId}.doc1`,
        },
        undefined,
      )
      expect(mockClient.create).toHaveBeenNthCalledWith(
        2,
        {
          _id: `versions.${revertReleaseId}.doc2`,
        },
        undefined,
      )
    })

    it('should throw an error if creating the release fails', async () => {
      mockClient.request.mockRejectedValueOnce(new Error('Failed to create release'))

      await expect(
        store.revertRelease(revertReleaseDocumentId, releaseDocuments, releaseMetadata, 'staged'),
      ).rejects.toThrow('Failed to create release')
    })
  })

  // it('should create a version of a document', async () => {
  //   const store = createStore()
  //   mockClient.getDocument.mockResolvedValue({_id: 'doc-id', data: 'example'})
  //   await store.createVersion('release-id', 'doc-id', {newData: 'value'})
  //   expect(mockClient.create).toHaveBeenCalledWith(
  //     {
  //       _id: `versions.release-id.doc-id`,
  //       data: 'example',
  //       newData: 'value',
  //     },
  //     undefined,
  //   )
  // })

  it('should omit _weak from reference fields if _strengthenOnPublish is present when it creates a version of a document', async () => {
    const store = createStore()

    mockClient.getDocument.mockResolvedValue({
      _id: 'doc-id',
      data: 'example',
      artist: {
        _ref: 'some-artist-id',
        _strengthenOnPublish: {
          template: {
            id: 'artist',
          },
          type: 'artist',
        },
        _type: 'reference',
        _weak: true,
      },
      expectedWeakReference: {
        _ref: 'expected-weak-reference',
        _type: 'reference',
        _weak: true,
        _strengthenOnPublish: {
          template: {
            id: 'some-document',
          },
          type: 'some-document',
          weak: true,
        },
      },
      plants: [
        {
          _ref: 'some-plant-id',
          _strengthenOnPublish: {
            template: {
              id: 'plant',
            },
            type: 'plant',
          },
          _type: 'reference',
          _weak: true,
        },
        {
          _ref: 'some-plant-id',
          _strengthenOnPublish: {
            template: {
              id: 'plant',
            },
            type: 'plant',
          },
          _type: 'reference',
          _weak: true,
        },
      ],
      stores: [
        {
          name: 'some-store',
          inventory: {
            products: [
              {
                _ref: 'some-product-id',
                _strengthenOnPublish: {
                  template: {
                    id: 'product',
                  },
                  type: 'product',
                },
                _type: 'reference',
                _weak: true,
              },
              {
                _ref: 'some-product-id',
                _strengthenOnPublish: {
                  template: {
                    id: 'product',
                  },
                  type: 'product',
                },
                _type: 'reference',
                _weak: true,
              },
            ],
          },
        },
      ],
    })

    await store.createVersion('release-id', 'doc-id', {newData: 'value'})

    expect(mockClient.create).toHaveBeenCalledWith({
      _id: `versions.release-id.doc-id`,
      data: 'example',
      newData: 'value',
      artist: {
        _ref: 'some-artist-id',
        _strengthenOnPublish: {
          template: {
            id: 'artist',
          },
          type: 'artist',
        },
        _type: 'reference',
      },
      expectedWeakReference: {
        _ref: 'expected-weak-reference',
        _type: 'reference',
        _weak: true,
        _strengthenOnPublish: {
          template: {
            id: 'some-document',
          },
          type: 'some-document',
          weak: true,
        },
      },
      plants: [
        {
          _ref: 'some-plant-id',
          _strengthenOnPublish: {
            template: {
              id: 'plant',
            },
            type: 'plant',
          },
          _type: 'reference',
        },
        {
          _ref: 'some-plant-id',
          _strengthenOnPublish: {
            template: {
              id: 'plant',
            },
            type: 'plant',
          },
          _type: 'reference',
        },
      ],
      stores: [
        {
          name: 'some-store',
          inventory: {
            products: [
              {
                _ref: 'some-product-id',
                _strengthenOnPublish: {
                  template: {
                    id: 'product',
                  },
                  type: 'product',
                },
                _type: 'reference',
              },
              {
                _ref: 'some-product-id',
                _strengthenOnPublish: {
                  template: {
                    id: 'product',
                  },
                  type: 'product',
                },
                _type: 'reference',
              },
            ],
          },
        },
      ],
    })
  })

  it('should discard a version of a document', async () => {
    const store = createStore()
    await store.discardVersion('release-id', 'doc-id')
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.document.discard',
            draftId: 'versions.release-id.doc-id',
          },
        ],
      },
    })
  })

  it('should unpublish a version of a document', async () => {
    const store = createStore()
    await store.unpublishVersion('doc-id')
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.document.version.unpublish',
            draftId: 'doc-id',
            publishedId: `doc-id`,
          },
        ],
      },
    })
  })
})
