import {type ReleaseDocument} from '@sanity/client'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  activeASAPRelease,
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../__fixtures__/release.fixture'
import {type RevertDocument} from '../../tool/components/releaseCTAButtons/ReleaseRevertButton/useDocumentRevertStates'
import {
  createReleaseOperationsStore,
  type ReleaseOperationsStore,
} from '../createReleaseOperationStore'

describe('createReleaseOperationsStore', () => {
  let mockClient: any

  beforeEach(() => {
    mockClient = {
      config: vi.fn().mockReturnValue({dataset: 'test-dataset'}),
      releases: {
        create: vi.fn().mockResolvedValue(undefined),
        edit: vi.fn().mockResolvedValue(undefined),
        publish: vi.fn().mockResolvedValue(undefined),
        schedule: vi.fn().mockResolvedValue(undefined),
        unschedule: vi.fn().mockResolvedValue(undefined),
        archive: vi.fn().mockResolvedValue(undefined),
        unarchive: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      getDocument: vi.fn(),
      createVersion: vi.fn().mockResolvedValue(undefined),
      discardVersion: vi.fn().mockResolvedValue(undefined),
      unpublishVersion: vi.fn().mockResolvedValue(undefined),
    }
  })

  const createStore = () =>
    createReleaseOperationsStore({
      client: mockClient,
      onReleaseLimitReached: vi.fn(),
    })

  it('should create a release', async () => {
    const store = createStore()
    const release = activeASAPRelease
    await store.createRelease(release)
    expect(mockClient.releases.create).toHaveBeenCalledWith(
      {
        releaseId: 'rASAP',
        metadata: release.metadata,
      },
      undefined,
    )
  })

  it('should update a release', async () => {
    const store = createStore()
    const release = activeScheduledRelease
    await store.updateRelease(release)
    expect(mockClient.releases.edit).toHaveBeenCalledWith(
      {
        releaseId: 'rActive',
        patch: {
          set: {metadata: release.metadata},
          unset: [],
        },
      },
      undefined,
    )
  })

  it('should publish a release using stable publish', async () => {
    const store = createStore()
    await store.publishRelease(activeASAPRelease._id)
    expect(mockClient.releases.publish).toHaveBeenCalledWith(
      {
        releaseId: 'rASAP',
      },
      undefined,
    )
  })

  it('should schedule a release', async () => {
    const store = createStore()
    const date = new Date('2024-01-01T00:00:00Z')
    await store.schedule(scheduledRelease._id, date)
    expect(mockClient.releases.schedule).toHaveBeenCalledWith(
      {
        releaseId: 'rScheduled',
        publishAt: date.toISOString(),
      },
      undefined,
    )
  })

  it('should unschedule a release', async () => {
    const store = createStore()
    await store.unschedule(scheduledRelease._id)
    expect(mockClient.releases.unschedule).toHaveBeenCalledWith(
      {
        releaseId: 'rScheduled',
      },
      undefined,
    )
  })

  it('should archive a release', async () => {
    const store = createStore()
    await store.archive(activeScheduledRelease._id)
    expect(mockClient.releases.archive).toHaveBeenCalledWith(
      {
        releaseId: 'rActive',
      },
      undefined,
    )
  })

  it('should unarchive a release', async () => {
    const store = createStore()
    await store.unarchive(archivedScheduledRelease._id)
    expect(mockClient.releases.unarchive).toHaveBeenCalledWith(
      {
        releaseId: 'rArchived',
      },
      undefined,
    )
  })

  it('should delete a release', async () => {
    const store = createStore()
    await store.deleteRelease(publishedASAPRelease._id)
    expect(mockClient.releases.delete).toHaveBeenCalledWith(
      {
        releaseId: 'rPublished',
      },
      undefined,
    )
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

      expect(mockClient.releases.create).toHaveBeenCalledWith(
        {
          releaseId: revertReleaseId,
          metadata: {...releaseMetadata, releaseType: 'asap'},
        },
        undefined,
      )

      expect(mockClient.createVersion).toHaveBeenCalledWith(
        {
          document: {
            _id: 'versions.revert-release-id.doc1',
          },
          publishedId: 'doc1',
          releaseId: 'revert-release-id',
        },
        undefined,
      )

      expect(mockClient.releases.publish).toHaveBeenCalledWith(
        {
          releaseId: 'revert-release-id',
        },
        undefined,
      )
    })

    it('should create a new release without publishing when revertType is "staged"', async () => {
      await store.revertRelease(
        revertReleaseDocumentId,
        releaseDocuments,
        releaseMetadata,
        'staged',
      )

      expect(mockClient.releases.create).toHaveBeenCalledWith(
        {
          releaseId: revertReleaseId,
          metadata: {...releaseMetadata, releaseType: 'asap'},
        },
        undefined,
      )

      expect(mockClient.createVersion).toHaveBeenCalledTimes(2)
      expect(mockClient.releases.publish).not.toHaveBeenCalled()
    })

    it('should fail if a document does not exist and no initial value is provided', async () => {
      mockClient.getDocument.mockResolvedValueOnce(null)

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
      mockClient.createVersion.mockRejectedValueOnce(new Error('Failed to create version'))

      const result = await store.revertRelease(
        revertReleaseDocumentId,
        releaseDocuments,
        releaseMetadata,
        'staged',
      )

      expect(result).toBeUndefined()
      expect(mockClient.releases.create).toHaveBeenCalledTimes(1)
      expect(mockClient.createVersion).toHaveBeenCalledTimes(2)
    })

    it('should throw an error if creating the release fails', async () => {
      mockClient.releases.create.mockRejectedValueOnce(new Error('Failed to create release'))

      await expect(
        store.revertRelease(revertReleaseDocumentId, releaseDocuments, releaseMetadata, 'staged'),
      ).rejects.toThrow('Failed to create release')
    })
  })

  it('should create a version of a document', async () => {
    const store = createStore()
    mockClient.getDocument.mockResolvedValue({_id: 'doc-id', data: 'example'})
    await store.createVersion('release-id', 'doc-id', {newData: 'value'})
    expect(mockClient.createVersion).toHaveBeenCalledWith(
      {
        document: {
          _id: `versions.release-id.doc-id`,
          data: 'example',
          newData: 'value',
        },
        publishedId: 'doc-id',
        releaseId: 'release-id',
      },
      undefined,
    )
  })

  it('should omit _weak from reference fields if _strengthenOnPublish is present when it creates a version of a document', async () => {
    const store = createStore()

    mockClient.getDocument.mockResolvedValue({
      _id: 'doc-id',
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

    await store.createVersion('release-id', 'doc-id')

    expect(mockClient.createVersion).toHaveBeenCalledWith(
      {
        document: {
          _id: `versions.release-id.doc-id`,
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
        },
        publishedId: 'doc-id',
        releaseId: 'release-id',
      },
      undefined,
    )
  })

  it('should discard a version of a document', async () => {
    const store = createStore()
    await store.discardVersion('release-id', 'doc-id')
    expect(mockClient.discardVersion).toHaveBeenCalledWith(
      {
        releaseId: 'release-id',
        publishedId: 'doc-id',
      },
      false,
      undefined,
    )
  })

  it('should unpublish a version of a document', async () => {
    const store = createStore()
    await store.unpublishVersion('versions.release-id.doc-id')
    expect(mockClient.unpublishVersion).toHaveBeenCalledWith(
      {
        releaseId: 'release-id',
        publishedId: 'doc-id',
      },
      undefined,
    )
  })

  it('should create a release with options', async () => {
    const store = createStore()
    const release = activeASAPRelease
    const opts = {dryRun: true}
    await store.createRelease(release, opts)
    expect(mockClient.releases.create).toHaveBeenCalledWith(
      {
        releaseId: 'rASAP',
        metadata: release.metadata,
      },
      opts,
    )
  })

  it('should update a release with options', async () => {
    const store = createStore()
    const release = activeScheduledRelease
    const opts = {dryRun: true}
    await store.updateRelease(release, opts)
    expect(mockClient.releases.edit).toHaveBeenCalledWith(
      {
        releaseId: 'rActive',
        patch: {
          set: {metadata: release.metadata},
          unset: [],
        },
      },
      opts,
    )
  })

  it('should publish a release with dryRun', async () => {
    const store = createStore()
    const opts = {dryRun: true}
    await store.publishRelease(activeASAPRelease._id, opts)
    expect(mockClient.releases.publish).toHaveBeenCalledWith(
      {
        releaseId: 'rASAP',
      },
      opts,
    )
  })

  describe('handleReleaseLimitError', () => {
    type MethodTestCase<K extends keyof ReleaseOperationsStore> = {
      name: K
      method: string
      runTest: (store: ReleaseOperationsStore) => Promise<unknown>
    }

    const methods: MethodTestCase<keyof ReleaseOperationsStore>[] = [
      {
        name: 'createRelease',
        method: 'create',
        runTest: (store) => store.createRelease(activeASAPRelease),
      },
      {
        name: 'updateRelease',
        method: 'edit',
        runTest: (store) => store.updateRelease(activeScheduledRelease),
      },
      {
        name: 'publishRelease',
        method: 'publish',
        runTest: (store) => store.publishRelease(activeASAPRelease._id),
      },
      {
        name: 'schedule',
        method: 'schedule',
        runTest: (store) => store.schedule(scheduledRelease._id, new Date('2024-01-01T00:00:00Z')),
      },
      {
        name: 'unarchive',
        method: 'unarchive',
        runTest: (store) => store.unarchive(archivedScheduledRelease._id),
      },
    ]

    describe.each(methods)('$name', ({method, runTest}) => {
      it('should call onReleaseLimitReached when release limit is reached', async () => {
        const error = new Error('Release limit reached') as Error & {
          details: {type: 'releaseLimitExceededError'; limit: number}
        }
        error.details = {type: 'releaseLimitExceededError', limit: 5}
        mockClient.releases[method].mockRejectedValueOnce(error)

        const onReleaseLimitReached = vi.fn()
        const store = createReleaseOperationsStore({
          client: mockClient,
          onReleaseLimitReached,
        })

        await expect(runTest(store)).rejects.toThrow('Release limit reached')
        expect(onReleaseLimitReached).toHaveBeenCalledWith(5)
      })
    })
  })
})
