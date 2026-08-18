import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {type OperationArgs} from '../operations/types'
import {discardChanges} from './discardChanges'

const BASE_PAIR = {draftId: 'drafts.my-id', publishedId: 'my-id'}
const RELEASE_PAIR = {...BASE_PAIR, versionId: 'versions.rSummer.my-id'}
const VARIANT_PAIR = {...BASE_PAIR, versionId: 'versions.randomScope.my-id'}

function draftDocument(): SanityDocument {
  return {
    _id: BASE_PAIR.draftId,
    _type: 'example',
    _rev: 'draftRev',
    _createdAt: '2021-09-14T22:48:02.303Z',
    _updatedAt: '2021-09-14T22:48:02.303Z',
  }
}

function publishedDocument(): SanityDocument {
  return {
    _id: BASE_PAIR.publishedId,
    _type: 'example',
    _rev: 'publishedRev',
    _createdAt: '2021-09-14T22:48:02.303Z',
    _updatedAt: '2021-09-14T22:48:02.303Z',
  }
}

/** A plain (non-variant) release version snapshot. */
function releaseVersion(): SanityDocument {
  return {
    _id: RELEASE_PAIR.versionId,
    _type: 'example',
    _rev: 'releaseRev',
    _createdAt: '2021-09-14T22:48:02.303Z',
    _updatedAt: '2021-09-14T22:48:02.303Z',
    _system: {
      bundleId: 'rSummer',
      release: {_ref: '_.releases.rSummer', _weak: true},
      group: {_ref: 'my-id', _weak: true},
      scopeId: 'rSummer',
    },
  }
}

/**
 * A variant-scoped version snapshot: `_system.variant` set, bundle per `bundleId`. Release
 * bundles carry the `_system.release` reference, matching real release-scoped variant documents.
 */
function variantVersion(bundleId: 'drafts' | 'rSummer' | undefined): SanityDocument {
  const isReleaseBundle = Boolean(bundleId) && bundleId !== 'drafts'
  return {
    _id: VARIANT_PAIR.versionId,
    _type: 'example',
    _rev: 'variantRev',
    _createdAt: '2021-09-14T22:48:02.303Z',
    _updatedAt: '2021-09-14T22:48:02.303Z',
    _system: {
      ...(bundleId ? {bundleId} : {}),
      ...(isReleaseBundle ? {release: {_ref: `_.releases.${bundleId}`, _weak: true}} : {}),
      variant: {_ref: '_.variants.french', _weak: true},
      group: {_ref: 'my-id', _weak: true},
      scopeId: 'randomScope',
    },
  }
}

describe('discardChanges', () => {
  describe('disabled', () => {
    it('is enabled for a draft', () => {
      expect(
        discardChanges.disabled({
          snapshots: {draft: draftDocument(), published: publishedDocument()},
        } as unknown as OperationArgs),
      ).toBe(false)
    })

    it('is enabled for a variant', () => {
      expect(
        discardChanges.disabled({
          snapshots: {version: variantVersion('drafts')},
        } as unknown as OperationArgs),
      ).toBe(false)
    })

    it('is enabled for a release version', () => {
      expect(
        discardChanges.disabled({
          snapshots: {version: releaseVersion()},
        } as unknown as OperationArgs),
      ).toBe(false)
    })

    it('is enabled for a release-scoped variant', () => {
      expect(
        discardChanges.disabled({
          snapshots: {version: variantVersion('rSummer')},
        } as unknown as OperationArgs),
      ).toBe(false)
    })

    it('returns NO_CHANGES for a published document', () => {
      expect(
        discardChanges.disabled({
          snapshots: {draft: null, version: null, published: publishedDocument()},
        } as unknown as OperationArgs),
      ).toBe('NO_CHANGES')
    })

    it('returns NO_CHANGES for a published variant (removing it is unpublish)', () => {
      expect(
        discardChanges.disabled({
          snapshots: {version: variantVersion(undefined)},
        } as unknown as OperationArgs),
      ).toBe('NO_CHANGES')
    })
  })

  describe('execute', () => {
    it('discards a draft via version.discard', () => {
      const client = createMockSanityClient()

      discardChanges.execute({
        client,
        idPair: BASE_PAIR,
        snapshots: {draft: draftDocument()},
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.version.discard',
            versionId: BASE_PAIR.draftId,
          },
          options: {tag: 'document.discard-changes'},
        },
      ])
    })

    it('discards a variant via version.discard', () => {
      const client = createMockSanityClient()

      discardChanges.execute({
        client,
        idPair: VARIANT_PAIR,
        snapshots: {version: variantVersion('drafts')},
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.version.discard',
            versionId: VARIANT_PAIR.versionId,
          },
          options: {tag: 'document.discard-changes'},
        },
      ])
    })

    it('discards a release version via version.discard', () => {
      const client = createMockSanityClient()

      discardChanges.execute({
        client,
        idPair: RELEASE_PAIR,
        snapshots: {version: releaseVersion()},
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.version.discard',
            versionId: RELEASE_PAIR.versionId,
          },
          options: {tag: 'document.discard-changes'},
        },
      ])
    })

    it('discards a release-scoped variant via version.discard', () => {
      const client = createMockSanityClient()

      discardChanges.execute({
        client,
        idPair: VARIANT_PAIR,
        snapshots: {version: variantVersion('rSummer')},
      } as unknown as OperationArgs)

      expect(client.$log.observable.action).toEqual([
        {
          actions: {
            actionType: 'sanity.action.document.version.discard',
            versionId: VARIANT_PAIR.versionId,
          },
          options: {tag: 'document.discard-changes'},
        },
      ])
    })

    it('throws when executing against a published variant', () => {
      const client = createMockSanityClient()

      expect(() => {
        discardChanges.execute({
          client,
          idPair: VARIANT_PAIR,
          snapshots: {version: variantVersion(undefined)},
        } as unknown as OperationArgs)
      }).toThrow('Cannot discard changes of a published variant: unpublish it instead')

      expect(client.$log.observable.action).toEqual([])
    })
  })
})
