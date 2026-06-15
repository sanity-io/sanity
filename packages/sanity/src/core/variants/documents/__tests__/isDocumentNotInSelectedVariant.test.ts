import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {isDocumentNotInSelectedVariant} from '../isDocumentNotInSelectedVariant'

const PUBLISHED_ID = 'article-1'
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

const draftDefault = versionStub({
  _id: 'drafts.article-1',
  _system: {bundleId: 'drafts', release: null, variant: null, group: groupRef, scopeId: null},
})
const draftAlpha = versionStub({
  _id: 'drafts.scope.article-1',
  _system: {
    bundleId: 'drafts',
    release: null,
    variant: variantRef(variantAlphaAudience._id),
    group: groupRef,
    scopeId: 'scope',
  },
})
const publishedAlpha = versionStub({
  _id: 'published.scope.article-1',
  _system: {
    bundleId: '$published',
    release: null,
    variant: variantRef(variantAlphaAudience._id),
    group: groupRef,
    scopeId: 'scope',
  },
})

const baseArgs = {
  variantsEnabled: true,
  selectedVariant: variantAlphaAudience,
  bundle: 'drafts',
  documentVersions: {versions: [draftDefault], loading: false},
} as const

describe('isDocumentNotInSelectedVariant', () => {
  it('returns true when a variant is selected but no matching variant version exists in the bundle', () => {
    expect(isDocumentNotInSelectedVariant(baseArgs)).toBe(true)
  })

  it('returns false when a matching variant version exists in the bundle', () => {
    expect(
      isDocumentNotInSelectedVariant({
        ...baseArgs,
        documentVersions: {versions: [draftDefault, draftAlpha], loading: false},
      }),
    ).toBe(false)
  })

  it('returns false when variants are disabled', () => {
    expect(isDocumentNotInSelectedVariant({...baseArgs, variantsEnabled: false})).toBe(false)
  })

  it('returns false when no variant is selected', () => {
    expect(isDocumentNotInSelectedVariant({...baseArgs, selectedVariant: undefined})).toBe(false)
  })

  it('returns false while document versions are loading', () => {
    expect(
      isDocumentNotInSelectedVariant({
        ...baseArgs,
        documentVersions: {versions: [], loading: true},
      }),
    ).toBe(false)
  })

  it('returns false when no document versions exist (new/uncreated document)', () => {
    expect(
      isDocumentNotInSelectedVariant({
        ...baseArgs,
        documentVersions: {versions: [], loading: false},
      }),
    ).toBe(false)
  })

  it('matches the bundle exactly and does not fall back to the variant-of-published', () => {
    // In the published perspective, a drafts variant document must NOT satisfy the check.
    expect(
      isDocumentNotInSelectedVariant({
        ...baseArgs,
        bundle: '$published',
        documentVersions: {versions: [draftAlpha], loading: false},
      }),
    ).toBe(true)

    // The published variant document does satisfy it.
    expect(
      isDocumentNotInSelectedVariant({
        ...baseArgs,
        bundle: '$published',
        documentVersions: {versions: [publishedAlpha], loading: false},
      }),
    ).toBe(false)
  })
})
