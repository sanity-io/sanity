import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {type VariantId} from '../../variants/types'
import {resolveManageVersionsCreateBase} from './resolveManageVersionsCreateBase'

const VARIANT_ID = '_.variants.road-cyclists' as VariantId
const PUBLISHED_ID = 'page-1'
const groupRef = {_type: 'reference' as const, _ref: PUBLISHED_ID, _weak: true as const}

const versionStub = (
  stub: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): VersionInfoDocumentStub => ({
  _rev: '',
  _createdAt: '',
  _updatedAt: '',
  _type: 'page',
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

const publishedVariant = versionStub({
  _id: 'versions.road-scope.page-1',
  _system: {
    variants: [{_ref: VARIANT_ID, _key: 'k-1'}],
    group: groupRef,
    scopeId: 'road-scope',
  },
})

describe('resolveManageVersionsCreateBase', () => {
  it('uses the published variant when one exists for the selected variant', () => {
    expect(
      resolveManageVersionsCreateBase({
        variantId: VARIANT_ID,
        documentVersions: [publishedBase, draftBase, publishedVariant],
        fallback: draftBase,
      }),
    ).toEqual({_id: publishedVariant._id})
  })

  it('falls back to the base document when no published variant exists', () => {
    expect(
      resolveManageVersionsCreateBase({
        variantId: VARIANT_ID,
        documentVersions: [publishedBase, draftBase],
        fallback: draftBase,
      }),
    ).toEqual({_id: draftBase._id})
  })

  it('returns null when there is no published variant and no base document', () => {
    expect(
      resolveManageVersionsCreateBase({
        variantId: VARIANT_ID,
        documentVersions: [],
        fallback: null,
      }),
    ).toBeNull()
  })
})
