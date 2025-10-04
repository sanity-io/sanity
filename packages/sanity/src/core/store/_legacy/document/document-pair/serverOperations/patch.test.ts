import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {type IdPair} from '../../types'
import {checkoutPair} from '../checkoutPair'
import {type OperationArgs} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {patch} from './patch'

vi.mock('../utils/isLiveEditEnabled', () => ({isLiveEditEnabled: vi.fn()}))

beforeEach(() => {
  ;(isLiveEditEnabled as Mock).mockClear()
})

describe('patch', () => {
  describe('draft exists, version not checked-out', () => {
    it('operates on the draft document only', () => {
      const client = createMockSanityClient() as unknown as SanityClient

      const idPair: IdPair = {
        draftId: 'drafts.my-id',
        publishedId: 'my-id',
      }

      const pair = checkoutPair(client, idPair, of(true))
      const versionMutate = vi.fn()
      const draftMutate = vi.fn()
      const publishedMutate = vi.fn()

      if (typeof pair.version !== 'undefined') {
        pair.version.mutate = versionMutate
      }

      pair.draft.mutate = draftMutate
      pair.published.mutate = publishedMutate

      patch.execute(
        {
          client,
          idPair,
          snapshots: {
            draft: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'drafts.my-id',
              _type: 'example',
              _updatedAt: '2021-09-14T22:48:02.303Z',
              newValue: 'hey',
            },
            published: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'drafts.my-id',
              _type: 'example',
              _updatedAt: '2021-09-14T22:48:02.303Z',
            },
          },
          serverActionsEnabled: true,
          ...pair,
        } as unknown as OperationArgs,
        [
          {
            unset: ['newValue'],
          },
        ],
      )

      expect(draftMutate).toHaveBeenCalledOnce()

      expect(draftMutate).toHaveBeenCalledWith([
        {
          patch: {
            id: 'drafts.my-id',
            unset: ['newValue'],
          },
        },
      ])

      expect(publishedMutate).not.toHaveBeenCalled()
      expect(versionMutate).not.toHaveBeenCalled()
    })
  })

  describe('draft exists, version checked-out', () => {
    it('operates on the version document only', () => {
      const client = createMockSanityClient() as unknown as SanityClient

      const idPair: IdPair = {
        draftId: 'drafts.my-id',
        publishedId: 'my-id',
        versionId: 'versions.x.my-id',
      }

      const pair = checkoutPair(client, idPair, of(true))
      const versionMutate = vi.fn()
      const draftMutate = vi.fn()
      const publishedMutate = vi.fn()

      if (typeof pair.version !== 'undefined') {
        pair.version.mutate = versionMutate
      }

      pair.draft.mutate = draftMutate
      pair.published.mutate = publishedMutate

      patch.execute(
        {
          client,
          idPair,
          snapshots: {
            draft: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'drafts.my-id',
              _type: 'example',
              _updatedAt: '2021-09-14T22:48:02.303Z',
              newValue: 'hey',
            },
            published: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'drafts.my-id',
              _type: 'example',
              _updatedAt: '2021-09-14T22:48:02.303Z',
            },
            version: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'versions.x.my-id',
              _type: 'example',
              _updatedAt: '2021-09-14T22:48:02.303Z',
              newValue: 'hey',
            },
          },
          serverActionsEnabled: true,
          ...pair,
        } as unknown as OperationArgs,
        [
          {
            unset: ['newValue'],
          },
        ],
      )

      expect(versionMutate).toHaveBeenCalledOnce()

      expect(versionMutate).toHaveBeenCalledWith([
        {
          patch: {
            id: 'versions.x.my-id',
            unset: ['_empty_action_guard_pseudo_field_'],
          },
        },
        {
          patch: {
            id: 'versions.x.my-id',
            unset: ['newValue'],
          },
        },
      ])

      expect(draftMutate).not.toHaveBeenCalled()
      expect(publishedMutate).not.toHaveBeenCalled()
    })
  })
})

describe('server patch version.create', () => {
  it('calls version.create for create draft from published scenario', () => {
    const mockActionRequest = vi.fn()
    const mockSubscribe = vi.fn()
    mockActionRequest.mockReturnValue({
      subscribe: mockSubscribe,
      pipe: vi.fn().mockReturnThis(),
    })

    const mockClient = createMockSanityClient() as unknown as SanityClient
    // Override the observable.action method for our test
    ;(mockClient as any).observable = {
      action: mockActionRequest,
    }

    const mockDraft = {
      patch: vi.fn().mockReturnValue([{patch: {id: 'draftId', set: {title: 'Updated Title'}}}]),
      createIfNotExists: vi.fn().mockReturnValue({createIfNotExists: {_id: 'drafts.publishedId'}}),
      mutate: vi.fn(),
      snapshots$: of({
        _id: 'drafts.publishedId',
        _type: 'testType',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-01T00:00:00Z',
        _rev: 'draft-rev-123',
      }),
      create: vi.fn(),
      createOrReplace: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(),
    }

    const mockPublished = {
      patch: vi.fn(),
      createIfNotExists: vi.fn(),
      mutate: vi.fn(),
      snapshots$: of({
        _id: 'publishedId',
        _type: 'testType',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-01T00:00:00Z',
        _rev: 'published-rev-123',
      }),
      create: vi.fn(),
      createOrReplace: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(),
    }

    const mockHistoryStore = {
      getDocumentAtRevision: vi.fn(),
      getDocumentAtVersion: vi.fn(),
      getHistory: vi.fn(),
      getTransactions: vi.fn(),
      restore: vi.fn(),
      getTimelineController: vi.fn(),
    }

    const mockSchema = {
      _registry: {},
      name: 'test',
      get: vi.fn(),
      has: vi.fn(),
      getTypeNames: vi.fn(),
      getLocalTypeNames: vi.fn(),
    }

    const result = patch.execute(
      {
        historyStore: mockHistoryStore,
        client: mockClient,
        schema: mockSchema,
        snapshots: {
          published: {
            _id: 'publishedId',
            _type: 'testType',
            _rev: 'published-rev-123',
            _createdAt: '2024-01-01T00:00:00Z',
            _updatedAt: '2024-01-01T00:00:00Z',
            title: 'Original Title',
          },
          draft: null, // no draft exists yet - this is the "create draft from published" scenario
        },
        idPair: {
          publishedId: 'publishedId',
          draftId: 'drafts.publishedId',
        },
        draft: mockDraft,
        published: mockPublished,
        typeName: 'testType',
        serverActionsEnabled: true,
      },
      [{set: {title: 'Updated Title'}}],
      {},
    )

    expect(result).toBeUndefined()

    // Should apply patches optimistically via mutate
    expect(mockDraft.mutate).toHaveBeenCalledWith([
      {createIfNotExists: {_id: 'drafts.publishedId'}},
      {patch: {id: 'draftId', set: {title: 'Updated Title'}}},
    ])

    expect(mockActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.version.create',
          publishedId: 'publishedId',
          versionId: 'drafts.publishedId',
          baseId: 'publishedId',
          ifBaseRevisionId: 'published-rev-123',
        },
      ],
      {tag: 'document.commit'},
    )

    expect(mockSubscribe).toHaveBeenCalled()
  })
})
