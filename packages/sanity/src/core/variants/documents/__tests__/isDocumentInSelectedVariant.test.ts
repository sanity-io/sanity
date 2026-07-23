import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {isDocumentInSelectedVariant} from '../isDocumentInSelectedVariant'

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
  // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
  _system: {bundleId: 'drafts', release: null, variant: null, group: groupRef, scopeId: null},
})
const draftAlpha = versionStub({
  _id: 'drafts.scope.article-1',
  _system: {
    bundleId: 'drafts',
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    release: null,
    variant: variantRef(variantAlphaAudience._id),
    group: groupRef,
    scopeId: 'scope',
  },
})
const publishedAlpha = versionStub({
  _id: 'published.scope.article-1',
  _system: {
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    bundleId: null,
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    release: null,
    variant: variantRef(variantAlphaAudience._id),
    group: groupRef,
    scopeId: 'scope',
  },
})

const baseArgs = {
  selectedVariant: variantAlphaAudience,
  bundle: 'drafts',
  documentVersions: [draftDefault],
}

describe('isDocumentInSelectedVariant', () => {
  it('returns false when a variant is selected but no matching variant version exists in the bundle', () => {
    expect(isDocumentInSelectedVariant(baseArgs)).toBe(false)
  })

  it('returns true when a matching variant version exists in the bundle', () => {
    expect(
      isDocumentInSelectedVariant({
        ...baseArgs,
        documentVersions: [draftDefault, draftAlpha],
      }),
    ).toBe(true)
  })

  it('matches the bundle exactly and does not fall back to the variant-of-published', () => {
    // In the published perspective, a drafts variant document must NOT satisfy the check.
    expect(
      isDocumentInSelectedVariant({
        ...baseArgs,
        bundle: 'published',
        documentVersions: [draftAlpha],
      }),
    ).toBe(false)

    // The published variant document does satisfy it.
    expect(
      isDocumentInSelectedVariant({
        ...baseArgs,
        bundle: 'published',
        documentVersions: [publishedAlpha],
      }),
    ).toBe(true)
  })
})
