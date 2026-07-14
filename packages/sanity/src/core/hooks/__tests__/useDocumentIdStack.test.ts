import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {buildVariantIdStack} from '../useDocumentIdStack'

const PUBLISHED_ID = 'article-1'
const VARIANT_ID = '_.variants.french'
const groupRef = {_type: 'reference', _ref: PUBLISHED_ID, _weak: true} as const
const variantRef = {_type: 'reference', _ref: VARIANT_ID, _weak: true} as const

const versionStub = (
  stub: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): VersionInfoDocumentStub => ({
  _rev: '',
  _createdAt: '',
  _updatedAt: '',
  ...stub,
})

const release = (releaseId: string, releaseType: 'asap' | 'scheduled' = 'asap') =>
  ({
    _id: `_.releases.${releaseId}`,
    metadata: {releaseType},
  }) as unknown as ReleaseDocument

const basePublished = versionStub({_id: PUBLISHED_ID, _system: {group: groupRef}})
const baseDraft = versionStub({
  _id: `drafts.${PUBLISHED_ID}`,
  _system: {bundleId: 'drafts', group: groupRef},
})
const variantPublished = versionStub({
  _id: `versions.scopePub.${PUBLISHED_ID}`,
  _system: {variant: variantRef, group: groupRef, scopeId: 'scopePub'},
})
const variantDraft = versionStub({
  _id: `versions.scopeDraft.${PUBLISHED_ID}`,
  _system: {bundleId: 'drafts', variant: variantRef, group: groupRef, scopeId: 'scopeDraft'},
})
const variantSummer = versionStub({
  _id: `versions.scopeSummer.${PUBLISHED_ID}`,
  _system: {bundleId: 'rSummer', variant: variantRef, group: groupRef, scopeId: 'scopeSummer'},
})
const variantWinter = versionStub({
  _id: `versions.scopeWinter.${PUBLISHED_ID}`,
  _system: {bundleId: 'rWinter', variant: variantRef, group: groupRef, scopeId: 'scopeWinter'},
})

const allVersions = [
  basePublished,
  baseDraft,
  variantPublished,
  variantDraft,
  // Deliberately out of release order to prove ordering comes from the releases list.
  variantWinter,
  variantSummer,
]

const baseOptions = {
  displayedId: variantDraft._id,
  isDraftModelEnabled: true,
  releases: [release('rSummer'), release('rWinter')],
  variantId: VARIANT_ID,
  versions: allVersions,
}

describe('buildVariantIdStack', () => {
  it('layers variant published, draft, then releases in active-release order', () => {
    expect(buildVariantIdStack(baseOptions)).toEqual([
      variantPublished._id,
      variantDraft._id,
      variantSummer._id,
      variantWinter._id,
    ])
  })

  it('never includes base pair or plain release ids', () => {
    const stack = buildVariantIdStack(baseOptions)
    expect(stack).not.toContain(basePublished._id)
    expect(stack).not.toContain(baseDraft._id)
  })

  it('omits layers whose variant document does not exist', () => {
    expect(
      buildVariantIdStack({...baseOptions, versions: [basePublished, baseDraft, variantDraft]}),
    ).toEqual([variantDraft._id])
  })

  it('omits the draft layer when the draft model is disabled', () => {
    expect(buildVariantIdStack({...baseOptions, isDraftModelEnabled: false})).toEqual([
      variantPublished._id,
      variantSummer._id,
      variantWinter._id,
    ])
  })

  it('ignores variant stubs whose bundle is not an active release', () => {
    const archived = versionStub({
      _id: `versions.scopeOld.${PUBLISHED_ID}`,
      _system: {bundleId: 'rArchived', variant: variantRef, group: groupRef, scopeId: 'scopeOld'},
    })
    expect(
      buildVariantIdStack({...baseOptions, versions: [...allVersions, archived]}),
    ).not.toContain(archived._id)
  })

  describe('strict mode', () => {
    it('includes the draft layer only when displayed', () => {
      expect(buildVariantIdStack({...baseOptions, strict: true})).toContain(variantDraft._id)
      expect(
        buildVariantIdStack({...baseOptions, strict: true, displayedId: variantPublished._id}),
      ).not.toContain(variantDraft._id)
    })

    it('includes only the displayed release and scheduled releases', () => {
      expect(
        buildVariantIdStack({
          ...baseOptions,
          strict: true,
          displayedId: variantSummer._id,
          releases: [release('rSummer'), release('rWinter', 'scheduled')],
        }),
      ).toEqual([variantPublished._id, variantSummer._id, variantWinter._id])

      expect(
        buildVariantIdStack({...baseOptions, strict: true, displayedId: variantDraft._id}),
      ).toEqual([variantPublished._id, variantDraft._id])
    })
  })
})
