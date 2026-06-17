import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getTargetDocument} from '../getTargetDocument'

const PUBLISHED_ID = 'article-1'
const groupRef = {_type: 'reference', _ref: PUBLISHED_ID, _weak: true} as const

// The backend stores the full variant document id in `_system.variant._ref`.
const VARIANT_ALPHA_ID = '_.variants.alpha'
const VARIANT_NORWEGIAN_ID = '_.variants.norwegian'

const variantRef = (variantId: string) =>
  ({_type: 'reference', _ref: variantId, _weak: true}) as const

const versionStub = (
  stub: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): VersionInfoDocumentStub => ({
  _rev: '',
  _createdAt: '',
  _updatedAt: '',
  ...stub,
})

// Published bundle: a default document plus two variant-scoped documents.
const publishedDefault = versionStub({
  _id: PUBLISHED_ID,
  _system: {
    release: null,
    variant: null,
    group: groupRef,
    scopeId: null,
  } as unknown as DocumentSystem,
})
const publishedAlpha = versionStub({
  _id: 'published.bar.article-1',
  _system: {
    release: null,
    variant: variantRef(VARIANT_ALPHA_ID),
    group: groupRef,
    scopeId: 'bar',
  } as unknown as DocumentSystem,
})

// Drafts bundle: a default document plus two variant-scoped documents.
const draftDefault = versionStub({
  _id: 'drafts.article-1',
  _system: {
    bundleId: 'drafts',
    release: null,
    variant: null,
    group: groupRef,
    scopeId: null,
  },
})
const draftAlpha = versionStub({
  _id: 'drafts.baz.article-1',
  _system: {
    bundleId: 'drafts',
    release: null,
    variant: variantRef(VARIANT_ALPHA_ID),
    group: groupRef,
    scopeId: 'baz',
  },
})
const draftNorwegian = versionStub({
  _id: 'drafts.qux.article-1',
  _system: {
    bundleId: 'drafts',
    release: null,
    variant: variantRef(VARIANT_NORWEGIAN_ID),
    group: groupRef,
    scopeId: 'qux',
  },
})

// Release bundle: a default document plus one variant-scoped document.
const releaseRef = {_type: 'reference', _ref: 'rASAP', _weak: true} as const
const releaseDefault = versionStub({
  _id: 'versions.rASAP.article-1',
  _system: {
    bundleId: 'rASAP',
    release: releaseRef,
    variant: null,
    group: groupRef,
    scopeId: 'rASAP',
  },
})
const releaseAlpha = versionStub({
  _id: 'versions.buz.article-1',
  _system: {
    bundleId: 'rASAP',
    release: releaseRef,
    variant: variantRef(VARIANT_ALPHA_ID),
    group: groupRef,
    scopeId: 'buz',
  },
})

const documentVersions: VersionInfoDocumentStub[] = [
  publishedDefault,
  publishedAlpha,
  draftDefault,
  draftAlpha,
  draftNorwegian,
  releaseDefault,
  releaseAlpha,
]

describe('getTargetDocument', () => {
  describe('without a variant', () => {
    it('finds the published default document', () => {
      expect(
        getTargetDocument({bundle: 'published', variant: undefined, documentVersions}),
      ).toEqual(publishedDefault)
    })
    it('returns undefined if the published default version is not in the bundle', () => {
      const result = getTargetDocument({
        bundle: 'published',
        variant: undefined,
        documentVersions: documentVersions.filter(
          (version) => version._system.bundleId || version._system.variant !== null,
        ),
      })
      expect(result).toBeUndefined()
    })

    it('finds the drafts default document', () => {
      expect(getTargetDocument({bundle: 'drafts', variant: undefined, documentVersions})).toEqual(
        draftDefault,
      )
    })
    it('returns undefined if the draft default version is not in the bundle', () => {
      const result = getTargetDocument({
        bundle: 'drafts',
        variant: undefined,
        documentVersions: documentVersions.filter(
          // Filter out the default draft.
          (version) => version._system.bundleId !== 'drafts' && version._system.variant === null,
        ),
      })
      expect(result).toBeUndefined()
    })

    it('finds the release default document', () => {
      expect(getTargetDocument({bundle: 'rASAP', variant: undefined, documentVersions})).toEqual(
        releaseDefault,
      )
    })
    it('returns undefined if the release default version is not in the bundle', () => {
      const result = getTargetDocument({
        bundle: 'rASAP',
        variant: undefined,
        documentVersions: documentVersions.filter(
          (version) => version._system.bundleId !== 'rASAP' && version._system.variant === null,
        ),
      })
      expect(result).toBeUndefined()
    })
  })

  describe('with a variant', () => {
    it('finds the published document for a given variant', () => {
      expect(
        getTargetDocument({
          bundle: 'published',
          variant: VARIANT_ALPHA_ID,
          documentVersions,
        }),
      ).toEqual(publishedAlpha)
    })
    it('returns undefined if the published document is not in the bundle', () => {
      const result = getTargetDocument({
        bundle: 'published',
        variant: VARIANT_ALPHA_ID,
        documentVersions: documentVersions.filter(
          (version) =>
            version._system.bundleId || version._system.variant?._ref !== VARIANT_ALPHA_ID,
        ),
      })
      expect(result).toBeUndefined()
    })

    it('finds the drafts document for a given variant', () => {
      expect(
        getTargetDocument({
          bundle: 'drafts',
          variant: VARIANT_ALPHA_ID,
          documentVersions,
        }),
      ).toEqual(draftAlpha)
    })
    it('returns undefined if the draft document is not in the bundle', () => {
      const result = getTargetDocument({
        bundle: 'drafts',
        variant: VARIANT_ALPHA_ID,
        documentVersions: documentVersions.filter(
          (version) =>
            version._system.bundleId !== 'drafts' &&
            version._system.variant?._ref !== VARIANT_ALPHA_ID,
        ),
      })
      expect(result).toBeUndefined()
    })

    it('finds the release document for a given variant', () => {
      expect(
        getTargetDocument({
          bundle: 'rASAP',
          variant: VARIANT_ALPHA_ID,
          documentVersions,
        }),
      ).toEqual(releaseAlpha)
    })
    it('returns undefined if the release document is not in the bundle', () => {
      const result = getTargetDocument({
        bundle: 'rASAP',
        variant: VARIANT_ALPHA_ID,
        documentVersions: documentVersions.filter(
          (version) =>
            version._system.bundleId !== 'rASAP' &&
            version._system.variant?._ref !== VARIANT_ALPHA_ID,
        ),
      })
      expect(result).toBeUndefined()
    })

    it('distinguishes between multiple variants within the same bundle', () => {
      expect(
        getTargetDocument({
          bundle: 'drafts',
          variant: VARIANT_NORWEGIAN_ID,
          documentVersions,
        }),
      ).toEqual(draftNorwegian)
    })
  })

  describe('when nothing matches', () => {
    it('returns undefined when the variant does not exist in the bundle', () => {
      expect(
        getTargetDocument({
          bundle: 'published',
          variant: VARIANT_NORWEGIAN_ID,
          documentVersions,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when the bundle does not exist', () => {
      expect(
        getTargetDocument({bundle: 'rNonExistent', variant: undefined, documentVersions}),
      ).toBeUndefined()
    })

    it('returns undefined for an empty list of versions', () => {
      expect(
        getTargetDocument({bundle: 'drafts', variant: undefined, documentVersions: []}),
      ).toBeUndefined()
    })
  })
})
