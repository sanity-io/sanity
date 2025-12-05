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
const isLiveEditEnabledMock = isLiveEditEnabled as Mock<typeof isLiveEditEnabled>

describe('patch', () => {
  beforeEach(() => {
    isLiveEditEnabledMock.mockReturnValue(false)
  })
  describe('draft exists, version not checked-out', () => {
    it('operates on the draft document only, published document exists', () => {
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

      expect(draftMutate).toHaveBeenCalledTimes(1)

      expect(draftMutate).toHaveBeenNthCalledWith(1, [
        {
          patch: {
            id: 'drafts.my-id',
            unset: ['_empty_action_guard_pseudo_field_'],
          },
        },
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

    it('operates on the draft document only, published document does not exist', () => {
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
            published: null,
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

      expect(draftMutate).toHaveBeenCalledTimes(1)

      // Performs the same operations as the previous test, doesn't matter if the published document exists or not.
      expect(draftMutate).toHaveBeenNthCalledWith(1, [
        {
          patch: {
            id: 'drafts.my-id',
            unset: ['_empty_action_guard_pseudo_field_'],
          },
        },
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
  describe("draft doesn't exist, create when editing", () => {
    it('Published document exists', () => {
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
          typeName: 'example',
          snapshots: {
            draft: null,
            published: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'my-id',
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

      expect(draftMutate).toHaveBeenCalledTimes(2)

      expect(draftMutate).toHaveBeenNthCalledWith(1, [
        {
          createIfNotExists: {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _id: 'drafts.my-id',
            _type: 'example',
            newValue: 'hey',
          },
        },
      ])
      expect(draftMutate).toHaveBeenNthCalledWith(2, [
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
    it('No published document, has initial value', () => {
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
          typeName: 'example',
          snapshots: {
            draft: null,
            published: null,
          },
          serverActionsEnabled: true,
          ...pair,
        } as unknown as OperationArgs,
        [
          {
            unset: ['newValue'],
          },
        ],
        {
          _type: 'example',
          newValue: 'hey',
        },
      )

      expect(draftMutate).toHaveBeenCalledTimes(2)

      expect(draftMutate).toHaveBeenNthCalledWith(1, [
        {
          create: {
            _id: 'drafts.my-id',
            _type: 'example',
            newValue: 'hey',
          },
        },
      ])
      expect(draftMutate).toHaveBeenNthCalledWith(2, [
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
    it('No published document, has initial value', () => {
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
          typeName: 'example',
          snapshots: {
            draft: null,
            published: null,
          },
          serverActionsEnabled: true,
          ...pair,
        } as unknown as OperationArgs,
        [
          {
            unset: ['newValue'],
          },
        ],
        undefined,
      )

      expect(draftMutate).toHaveBeenCalledTimes(2)

      expect(draftMutate).toHaveBeenNthCalledWith(1, [
        {
          create: {
            _id: 'drafts.my-id',
            _type: 'example',
          },
        },
      ])
      expect(draftMutate).toHaveBeenNthCalledWith(2, [
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
describe('operating on liveEdit documents', () => {
  beforeEach(() => {
    isLiveEditEnabledMock.mockReturnValue(true)
  })
  it('creates the published document if it does not exist', () => {
    const client = createMockSanityClient() as unknown as SanityClient
    const idPair: IdPair = {draftId: 'drafts.my-id', publishedId: 'my-id'}
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
          draft: null,
          published: null,
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

    expect(publishedMutate).toHaveBeenCalledTimes(1)

    expect(publishedMutate).toHaveBeenNthCalledWith(1, [
      {
        createIfNotExists: {_id: 'my-id', _type: undefined},
      },
      {
        patch: {id: 'my-id', unset: ['newValue']},
      },
    ])

    expect(draftMutate).not.toHaveBeenCalled()
    expect(versionMutate).not.toHaveBeenCalled()
  })
  it('patches the published document if it exists', () => {
    const client = createMockSanityClient() as unknown as SanityClient
    const idPair: IdPair = {draftId: 'drafts.my-id', publishedId: 'my-id'}
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
          draft: null,
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

    expect(publishedMutate).toHaveBeenCalledTimes(1)

    expect(publishedMutate).toHaveBeenNthCalledWith(1, [
      {
        patch: {id: 'my-id', unset: ['newValue']},
      },
    ])

    expect(draftMutate).not.toHaveBeenCalled()
    expect(versionMutate).not.toHaveBeenCalled()
  })
})
