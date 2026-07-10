import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {getTargetDocumentState, getTargetScopeId} from '../useTargetDocumentState'

const PUBLISHED_ID = 'article-1'
const RELEASE_ID = 'rSummer'
const groupRef = {_type: 'reference', _ref: PUBLISHED_ID, _weak: true} as const
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

const publishedBase = versionStub({
  _id: PUBLISHED_ID,
  _system: {group: groupRef},
})
const draftBase = versionStub({
  _id: `drafts.${PUBLISHED_ID}`,
  _system: {bundleId: 'drafts', group: groupRef},
})
const releaseVersion = versionStub({
  _id: `versions.${RELEASE_ID}.${PUBLISHED_ID}`,
  _system: {
    bundleId: RELEASE_ID,
    release: {_ref: `_.releases.${RELEASE_ID}`, _weak: true},
    group: groupRef,
    scopeId: RELEASE_ID,
  },
})
const draftAlphaVariant = versionStub({
  _id: `versions.varscope.${PUBLISHED_ID}`,
  _system: {
    bundleId: 'drafts',
    variant: variantRef(variantAlphaAudience._id),
    group: groupRef,
    scopeId: 'varscope',
  },
})

const baseOptions = {
  bundle: 'drafts' as const,
  selectedVariant: undefined,
  selectedVariantName: undefined,
  variantsLoading: false,
  versions: [publishedBase, draftBase, releaseVersion, draftAlphaVariant],
  versionsLoading: false,
}

const variantOptions = {
  ...baseOptions,
  selectedVariant: variantAlphaAudience,
  selectedVariantName: 'alpha-audience',
}

describe('getTargetDocumentState', () => {
  describe('without a requested variant', () => {
    it('resolves while version stubs are loading', () => {
      expect(getTargetDocumentState({...baseOptions, versionsLoading: true})).toEqual({
        status: 'resolving',
      })
    })

    it('is ready with the base draft stub (no scopeId) on the drafts bundle', () => {
      expect(getTargetDocumentState(baseOptions)).toEqual({
        status: 'ready',
        targetDocument: draftBase,
        scopeId: undefined,
        variant: undefined,
      })
    })

    it('is ready with the release stub and release scopeId on a release bundle', () => {
      expect(getTargetDocumentState({...baseOptions, bundle: RELEASE_ID})).toEqual({
        status: 'ready',
        targetDocument: releaseVersion,
        scopeId: RELEASE_ID,
        variant: undefined,
      })
    })

    it('is ready with no target document when nothing exists for the bundle', () => {
      expect(
        getTargetDocumentState({...baseOptions, versions: [publishedBase], bundle: 'drafts'}),
      ).toEqual({
        status: 'ready',
        targetDocument: undefined,
        scopeId: undefined,
        variant: undefined,
      })
    })
  })

  describe('with a requested variant', () => {
    it('resolves while variant definitions are loading, before consulting version stubs', () => {
      expect(
        getTargetDocumentState({
          ...variantOptions,
          selectedVariant: undefined,
          variantsLoading: true,
        }),
      ).toEqual({status: 'resolving'})
    })

    it('resolves while version stubs are loading', () => {
      expect(getTargetDocumentState({...variantOptions, versionsLoading: true})).toEqual({
        status: 'resolving',
      })
    })

    it('surfaces a missing variant definition instead of falling back to no-variant', () => {
      expect(getTargetDocumentState({...variantOptions, selectedVariant: undefined})).toEqual({
        status: 'variant-definition-document-not-found',
        requestedVariantName: 'alpha-audience',
      })
    })

    it('is ready with the variant stub and its scopeId when the target exists', () => {
      expect(getTargetDocumentState(variantOptions)).toEqual({
        status: 'ready',
        targetDocument: draftAlphaVariant,
        scopeId: 'varscope',
        variant: variantAlphaAudience,
      })
    })

    it('is variant-missing when no variant-scoped version exists for the bundle', () => {
      // The variant document exists in the drafts bundle only; the published bundle has no target.
      expect(getTargetDocumentState({...variantOptions, bundle: 'published'})).toEqual({
        status: 'variant-missing',
        variant: variantAlphaAudience,
        bundle: 'published',
      })
    })
  })
})

describe('getTargetScopeId', () => {
  it('returns the scopeId only for ready states', () => {
    expect(getTargetScopeId(getTargetDocumentState(variantOptions))).toBe('varscope')
    expect(getTargetScopeId(getTargetDocumentState(baseOptions))).toBeUndefined()
    expect(
      getTargetScopeId(getTargetDocumentState({...variantOptions, versionsLoading: true})),
    ).toBeUndefined()
    expect(
      getTargetScopeId(getTargetDocumentState({...variantOptions, bundle: 'published'})),
    ).toBeUndefined()
  })
})
