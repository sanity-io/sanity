import {type VersionInfoDocumentStub, type SystemVariant} from 'sanity'
import {describe, expect, it} from 'vitest'

import {findVariantCreateBaseDocument} from '../findVariantCreateBaseDocument'

const PUBLISHED_ID = 'article-1'
const groupRef = {_type: 'reference' as const, _ref: PUBLISHED_ID, _weak: true as const}
const variantRef = (variantId: string) => ({
  _type: 'reference' as const,
  _ref: variantId,
  _weak: true as const,
})

const versionStub = (
  stub: Pick<VersionInfoDocumentStub, '_id' | '_rev' | '_system'>,
): VersionInfoDocumentStub => ({
  _createdAt: '',
  _updatedAt: '',
  ...stub,
})

const returningVisitor: SystemVariant = {
  _type: 'system.variant',
  _id: `_.variants.returning-visitor`,
  _createdAt: '',
  _updatedAt: '',
  _rev: 'returning-visitor-rev',
  conditions: {audience: 'returning'},
  priority: 0,
}

const publishedBase = versionStub({
  _id: PUBLISHED_ID,
  _rev: 'published-rev',
  _system: {group: groupRef},
})

const draftBase = versionStub({
  _id: `drafts.${PUBLISHED_ID}`,
  _rev: 'draft-rev',
  _system: {bundleId: 'drafts', group: groupRef},
})

const returningVisitorDraft = versionStub({
  _id: 'versions.returning-scope.article-1',
  _rev: 'returning-draft-rev',
  _system: {
    bundleId: 'drafts',
    variant: variantRef(returningVisitor._id),
    group: groupRef,
    scopeId: 'returning-scope',
  },
})

const returningVisitorPublished = versionStub({
  _id: 'versions.returning-pub-scope.article-1',
  _rev: 'returning-published-rev',
  _system: {
    variant: variantRef(returningVisitor._id),
    group: groupRef,
    scopeId: 'returning-pub-scope',
  },
})

describe('findVariantCreateBaseDocument', () => {
  it('prefers the drafts variant sibling when it exists', () => {
    const base = findVariantCreateBaseDocument({
      variant: returningVisitor,
      documentVersions: [
        publishedBase,
        draftBase,
        returningVisitorPublished,
        returningVisitorDraft,
      ],
      fallback: draftBase,
    })

    expect(base).toEqual({
      _id: returningVisitorDraft._id,
      _rev: returningVisitorDraft._rev,
    })
  })

  it('prefers the published variant sibling when no drafts sibling exists', () => {
    const base = findVariantCreateBaseDocument({
      variant: returningVisitor,
      documentVersions: [publishedBase, draftBase, returningVisitorPublished],
      fallback: draftBase,
    })

    expect(base).toEqual({
      _id: returningVisitorPublished._id,
      _rev: returningVisitorPublished._rev,
    })
  })

  it('falls back to the pane value when no variant sibling exists', () => {
    expect(
      findVariantCreateBaseDocument({
        variant: returningVisitor,
        documentVersions: [publishedBase, draftBase],
        fallback: draftBase,
      }),
    ).toEqual({_id: draftBase._id, _rev: draftBase._rev})
  })
})
