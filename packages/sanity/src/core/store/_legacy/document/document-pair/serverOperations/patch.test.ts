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
          createIfNotExists: {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _id: 'drafts.my-id',
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
