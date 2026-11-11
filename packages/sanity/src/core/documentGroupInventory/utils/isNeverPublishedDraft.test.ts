import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isNeverPublishedDraft} from './isNeverPublishedDraft'

const VARIANT_ID = '_.variants.new-customers'

function version(bundleId: string | undefined, variantId?: string): VersionInfoDocumentStub {
  return {
    _id: `${bundleId ?? 'published'}-${variantId ?? 'base'}`,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-02T00:00:00.000Z',
    _type: 'book',
    _system: {
      group: {_ref: 'book-1', _weak: true},
      bundleId,
      ...(variantId ? {variants: [{_ref: variantId, _weak: true}]} : {}),
    },
  } as VersionInfoDocumentStub
}

describe('isNeverPublishedDraft', () => {
  it('is false for a draft of a document that has a published version', () => {
    const draft = version('drafts')

    expect(isNeverPublishedDraft(draft, [draft, version(undefined)])).toBe(false)
  })

  it('is true for a draft with no published version', () => {
    const draft = version('drafts')

    expect(isNeverPublishedDraft(draft, [draft])).toBe(true)
  })

  it('is false for a version that is not a draft', () => {
    const published = version(undefined)
    const inRelease = version('rSummer')

    expect(isNeverPublishedDraft(published, [published])).toBe(false)
    expect(isNeverPublishedDraft(inRelease, [inRelease])).toBe(false)
  })

  it('looks for a published version of the same variant, not of the base document', () => {
    const variantDraft = version('drafts', VARIANT_ID)
    const publishedBase = version(undefined)

    expect(isNeverPublishedDraft(variantDraft, [variantDraft, publishedBase])).toBe(true)
  })

  it('is false for a variant draft whose variant has a published version', () => {
    const variantDraft = version('drafts', VARIANT_ID)
    const publishedVariant = version('published', VARIANT_ID)

    expect(isNeverPublishedDraft(variantDraft, [variantDraft, publishedVariant])).toBe(false)
  })

  it('is true for a base draft when only a variant has been published', () => {
    const draft = version('drafts')
    const publishedVariant = version(undefined, VARIANT_ID)

    expect(isNeverPublishedDraft(draft, [draft, publishedVariant])).toBe(true)
  })
})
