import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {type OperationArgs} from '../operations/types'
import {discardChanges} from './discardChanges'

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

describe('discardChanges', () => {
  describe('disabled', () => {
    it('returns NO_CHANGES when there is neither a draft nor a version', () => {
      expect(
        discardChanges.disabled({
          snapshots: {draft: null, version: null},
        } as unknown as OperationArgs),
      ).toBe('NO_CHANGES')
    })

    it('returns NO_CHANGES for the variant-of-published document (nothing draft-like to discard)', () => {
      expect(
        discardChanges.disabled({
          snapshots: {version: variantVersion(undefined)},
        } as unknown as OperationArgs),
      ).toBe('NO_CHANGES')
    })

    it('is enabled for a variant-over-drafts version', () => {
      expect(
        discardChanges.disabled({
          snapshots: {version: variantVersion('drafts')},
        } as unknown as OperationArgs),
      ).toBe(false)
    })
  })

  describe('execute', () => {
    it('routes a variant-over-drafts version to the variant delete action', () => {
      const client = createMockSanityClient()

      discardChanges.execute({
        client,
        idPair: {
          draftId: 'drafts.my-id',
          publishedId: 'my-id',
          versionId: 'versions.varscope.my-id',
        },
        snapshots: {version: variantVersion('drafts')},
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.variant.delete',
            publishedId: 'my-id',
            variantId: 'french',
            bundleId: 'drafts',
          },
          options: {tag: 'document.discard-changes'},
        },
      ])
    })

    it('keeps the generic discard action for non-variant documents', () => {
      const client = createMockSanityClient()

      discardChanges.execute({
        client,
        idPair: {draftId: 'drafts.my-id', publishedId: 'my-id'},
        snapshots: {draft: {} as SanityDocument},
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.discard',
            draftId: 'drafts.my-id',
          },
          options: {tag: 'document.discard-changes'},
        },
      ])
    })

    it('keeps the generic discard action targeting release versions via versionId', () => {
      const client = createMockSanityClient()

      discardChanges.execute({
        client,
        idPair: {
          draftId: 'drafts.my-id',
          publishedId: 'my-id',
          versionId: 'versions.rSummer.my-id',
        },
        snapshots: {
          version: {
            _id: 'versions.rSummer.my-id',
            _type: 'example',
            _rev: 'r1',
          } as SanityDocument,
        },
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.discard',
            draftId: 'versions.rSummer.my-id',
          },
          options: {tag: 'document.discard-changes'},
        },
      ])
    })
  })
})
