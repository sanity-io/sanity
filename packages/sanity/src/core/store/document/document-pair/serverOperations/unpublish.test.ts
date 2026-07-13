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

/**
 * A variant-scoped version snapshot: `_system.variant` set, bundle per `bundleId`. Release
 * bundles carry the `_system.release` reference, matching real release-scoped variant documents.
 */
function variantVersion(bundleId: 'drafts' | 'rSummer' | undefined): SanityDocument {
  const isReleaseBundle = Boolean(bundleId) && bundleId !== 'drafts'
  return {
    _id: 'versions.varscope.my-id',
    _type: 'example',
    _rev: 'variantRev',
    _createdAt: '2021-09-14T22:48:02.303Z',
    _updatedAt: '2021-09-14T22:48:02.303Z',
    _system: {
      ...(bundleId ? {bundleId} : {}),
      ...(isReleaseBundle ? {release: {_ref: `_.releases.${bundleId}`, _weak: true}} : {}),
      variant: {_ref: '_.variants.french', _weak: true},
      group: {_ref: 'my-id', _weak: true},
      scopeId: 'varscope',
    },
  }
}

describe('unpublish', () => {
  describe('disabled', () => {
    it('returns LIVE_EDIT_ENABLED if isLiveEditEnabled', () => {
      ;(isLiveEditEnabled as Mock).mockImplementation(() => true)

      expect(
        unpublish.disabled(
          // oxlint-disable-next-line no-explicit-any
          {} as any,
        ),
      ).toBe('LIVE_EDIT_ENABLED')
    })

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

    it('is enabled for a release-scoped variant (soft unpublish as part of the release)', () => {
      expect(
        unpublish.disabled({
          typeName: 'blah',
          snapshots: {version: variantVersion('rSummer')},
        } as unknown as OperationArgs),
      ).toBe(false)
    })

    it('returns NOT_PUBLISHED for a drafts-scoped variant (nothing published in its slot)', () => {
      expect(
        unpublish.disabled({
          typeName: 'blah',
          // The base published existing says nothing about the VARIANT being published.
          snapshots: {version: variantVersion('drafts'), published: {} as SanityDocument},
        } as unknown as OperationArgs),
      ).toBe('NOT_PUBLISHED')
    })

    it('returns NOT_PUBLISHED when version context has no published document', () => {
      expect(
        unpublish.disabled({
          typeName: 'book',
          idPair: {
            publishedId: 'my-id',
            draftId: 'drafts.my-id',
            versionId: 'versions.r1.my-id',
          },
          snapshots: {
            draft: undefined,
            published: undefined,
            version: {} as SanityDocument,
          },
        } as unknown as OperationArgs),
      ).toBe('NOT_PUBLISHED')
    })

    it('returns ALREADY_UNPUBLISHED when version is marked for unpublish', () => {
      expect(
        unpublish.disabled({
          typeName: 'book',
          idPair: {
            publishedId: 'my-id',
            draftId: 'drafts.my-id',
            versionId: 'versions.r1.my-id',
          },
          snapshots: {
            draft: undefined,
            published: {} as SanityDocument,
            version: {_system: {delete: true}} as SanityDocument,
          },
        } as unknown as OperationArgs),
      ).toBe('ALREADY_UNPUBLISHED')
    })

    it("otherwise the operation isn't disabled for published documents", () => {
      expect(
        unpublish.disabled({
          typeName: 'book',
          idPair: {
            publishedId: 'my-id',
            draftId: 'drafts.my-id',
          },
          snapshots: {
            draft: undefined,
            published: {} as SanityDocument,
          },
        } as unknown as OperationArgs),
      ).toBe(false)
    })
  })

  describe('execute', () => {
    it('routes a variant-of-published version to the variant unpublish action without a bundleId', () => {
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
          },
          options: {tag: 'document.unpublish', skipCrossDatasetReferenceValidation: true},
        },
      ])
      // @ts-expect-error - $log is not typed
      expect(client.$log.observable.action[0].actions.bundleId).toBeUndefined()
    })

    it('sends the release bundleId when unpublishing a release-scoped variant', () => {
      const client = createMockSanityClient()

      unpublish.execute({
        client,
        idPair: {
          draftId: 'drafts.my-id',
          publishedId: 'my-id',
          versionId: 'versions.varscope.my-id',
        },
        snapshots: {version: variantVersion('rSummer')},
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.variant.unpublish',
            publishedId: 'my-id',
            variantId: 'french',
            bundleId: 'rSummer',
          },
          options: {tag: 'document.unpublish', skipCrossDatasetReferenceValidation: true},
        },
      ])
    })

    it('throws when executing against a drafts-scoped variant', () => {
      const client = createMockSanityClient()

      expect(() => {
        unpublish.execute({
          client,
          idPair: {
            draftId: 'drafts.my-id',
            publishedId: 'my-id',
            versionId: 'versions.varscope.my-id',
          },
          snapshots: {version: variantVersion('drafts')},
        } as unknown as OperationArgs)
      }).toThrow('Cannot unpublish a draft variant')

      expect(client.$log.observable.action).toEqual([])
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

    it('uses sanity.action.document.version.unpublish for version context', () => {
      const client = createMockSanityClient()

      unpublish.execute({
        client,
        idPair: {
          draftId: 'drafts.my-id',
          publishedId: 'my-id',
          versionId: 'versions.r1.my-id',
        },
      } as unknown as OperationArgs)

      expect(client.$log).toMatchSnapshot()
    })
  })
})
