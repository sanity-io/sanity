import {type SanityDocument} from '@sanity/types'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {type OperationArgs} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {unpublish} from './unpublish'

vi.mock('../utils/isLiveEditEnabled', () => ({isLiveEditEnabled: vi.fn()}))

beforeEach(() => {
  ;(isLiveEditEnabled as Mock).mockImplementation(() => false)
})

/** A variant-scoped version snapshot: `_system.variant` set, bundle per `bundleId`. */
function variantVersion(bundleId: 'drafts' | 'rSummer' | undefined): SanityDocument {
  return {
    _id: 'versions.varscope.my-id',
    _type: 'example',
    _rev: 'variantRev',
    _createdAt: '2021-09-14T22:48:02.303Z',
    _updatedAt: '2021-09-14T22:48:02.303Z',
    _system: {
      ...(bundleId ? {bundleId} : {}),
      variant: {_ref: '_.variants.french', _weak: true},
      group: {_ref: 'my-id', _weak: true},
      scopeId: 'varscope',
    },
  }
}

describe('unpublish', () => {
  describe('disabled', () => {
    it('returns NOT_PUBLISHED when there is no published document', () => {
      expect(
        unpublish.disabled({
          typeName: 'blah',
          snapshots: {draft: {} as SanityDocument, published: null},
        } as unknown as OperationArgs),
      ).toBe('NOT_PUBLISHED')
    })

    it('is enabled when the checked-out version is the variant-of-published document', () => {
      expect(
        unpublish.disabled({
          typeName: 'blah',
          snapshots: {version: variantVersion(undefined)},
        } as unknown as OperationArgs),
      ).toBe(false)
    })

    it('returns NOT_PUBLISHED for variant versions in other bundles (sibling state unknown)', () => {
      expect(
        unpublish.disabled({
          typeName: 'blah',
          // The base published existing says nothing about the VARIANT being published.
          snapshots: {version: variantVersion('drafts'), published: {} as SanityDocument},
        } as unknown as OperationArgs),
      ).toBe('NOT_PUBLISHED')
    })
  })

  describe('execute', () => {
    it('routes a variant-of-published version to the variant unpublish action', () => {
      const client = createMockSanityClient()

      unpublish.execute({
        client,
        idPair: {
          draftId: 'drafts.my-id',
          publishedId: 'my-id',
          versionId: 'versions.varscope.my-id',
        },
        snapshots: {version: variantVersion(undefined)},
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.variant.unpublish',
            publishedId: 'my-id',
            variantId: 'french',
            bundleId: 'drafts',
          },
          options: {tag: 'document.unpublish', skipCrossDatasetReferenceValidation: true},
        },
      ])
    })

    it('keeps the base unpublish action for non-variant documents', () => {
      const client = createMockSanityClient()

      unpublish.execute({
        client,
        idPair: {draftId: 'drafts.my-id', publishedId: 'my-id'},
        snapshots: {published: {} as SanityDocument},
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.unpublish',
            draftId: 'drafts.my-id',
            publishedId: 'my-id',
          },
          options: {tag: 'document.unpublish', skipCrossDatasetReferenceValidation: true},
        },
      ])
    })
  })
})
