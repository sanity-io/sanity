import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {
  activeASAPRelease,
  activeScheduledRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type DocumentInVariantGroup, type VariantDocumentVersion} from './types'
import {getVariantBulkActionTargets} from './variantBulkActions'

const releasesById = new Map<string, ReleaseDocument>([
  [activeScheduledRelease._id, activeScheduledRelease],
  [activeASAPRelease._id, activeASAPRelease],
])

const publishedVersion: VariantDocumentVersion = {
  documentId: 'doc1',
  bundleId: undefined,
  releaseRef: null,
  updatedAt: '2026-01-01T00:00:00Z',
}
const draftVersion: VariantDocumentVersion = {
  documentId: 'drafts.doc1',
  bundleId: 'drafts',
  releaseRef: null,
  updatedAt: '2026-01-01T00:00:00Z',
}
const releaseVersion: VariantDocumentVersion = {
  documentId: 'versions.rActive.doc1',
  bundleId: activeScheduledRelease.name,
  releaseRef: activeScheduledRelease._id,
  updatedAt: '2026-01-01T00:00:00Z',
}
const secondReleaseVersion: VariantDocumentVersion = {
  documentId: 'versions.rASAP.doc1',
  bundleId: activeASAPRelease.name,
  releaseRef: activeASAPRelease._id,
  updatedAt: '2026-01-01T00:00:00Z',
}

function makeGroup(
  groupId: string,
  versions: VariantDocumentVersion[],
  title = 'Doc title',
): DocumentInVariantGroup {
  return {
    groupId,
    versions,
    version: versions[0],
    memoKey: groupId,
    document: {_id: groupId, _type: 'article', title, publishedDocumentExists: true},
    validation: {validation: [], hasError: false, isValidating: false},
  } as unknown as DocumentInVariantGroup
}

const VARIANT_ID = 'summer'

describe('getVariantBulkActionTargets', () => {
  it('publish targets only the drafts version, never published or release', () => {
    const group = makeGroup('doc1', [publishedVersion, draftVersion, releaseVersion])
    const targets = getVariantBulkActionTargets([group], VARIANT_ID, 'publish', releasesById)

    expect(targets).toHaveLength(1)
    expect(targets[0]).toMatchObject({
      groupId: 'doc1',
      publishedId: 'doc1',
      variantId: VARIANT_ID,
      bundleId: 'drafts',
    })
    expect(targets[0].bundle.kind).toBe('drafts')
  })

  it('unpublish targets the published variant and release versions, never drafts', () => {
    const group = makeGroup('doc1', [publishedVersion, draftVersion, releaseVersion])
    const targets = getVariantBulkActionTargets([group], VARIANT_ID, 'unpublish', releasesById)

    const kinds = targets.map((target) => target.bundle.kind).sort()
    expect(kinds).toEqual(['published', 'release'])

    const published = targets.find((target) => target.bundle.kind === 'published')
    // The published variant is addressed with an undefined bundleId (hard unpublish now).
    expect(published?.bundleId).toBeUndefined()

    const release = targets.find((target) => target.bundle.kind === 'release')
    // A release version passes the short release id verbatim (soft unpublish on release run).
    expect(release?.bundleId).toBe(activeScheduledRelease.name)
  })

  it('discard targets drafts and release versions, never published', () => {
    const group = makeGroup('doc1', [publishedVersion, draftVersion, releaseVersion])
    const targets = getVariantBulkActionTargets([group], VARIANT_ID, 'delete', releasesById)

    const kinds = targets.map((target) => target.bundle.kind).sort()
    expect(kinds).toEqual(['drafts', 'release'])
    expect(targets.some((target) => target.bundle.kind === 'published')).toBe(false)
  })

  it('fans a single document out to one target per release it lives in', () => {
    const group = makeGroup('doc1', [draftVersion, releaseVersion, secondReleaseVersion])
    const targets = getVariantBulkActionTargets([group], VARIANT_ID, 'delete', releasesById)

    // drafts + two distinct releases = three targets, each with a unique key.
    expect(targets).toHaveLength(3)
    expect(new Set(targets.map((target) => target.key)).size).toBe(3)
  })

  it('dedupes multiple versions resolving to the same bundle', () => {
    const duplicateDraft: VariantDocumentVersion = {...draftVersion, documentId: 'drafts.doc1#2'}
    const group = makeGroup('doc1', [draftVersion, duplicateDraft])
    const targets = getVariantBulkActionTargets([group], VARIANT_ID, 'delete', releasesById)

    expect(targets).toHaveLength(1)
  })

  it('returns no targets when a selected document has nothing the action can touch', () => {
    // A published-only document has no draft to publish.
    const group = makeGroup('doc1', [publishedVersion])
    expect(getVariantBulkActionTargets([group], VARIANT_ID, 'publish', releasesById)).toHaveLength(
      0,
    )
  })

  it('enumerates targets across several selected groups', () => {
    const groupA = makeGroup('docA', [draftVersion])
    const groupB = makeGroup('docB', [draftVersion, releaseVersion])
    const targets = getVariantBulkActionTargets(
      [groupA, groupB],
      VARIANT_ID,
      'delete',
      releasesById,
    )

    expect(targets.map((target) => target.groupId).sort()).toEqual(['docA', 'docB', 'docB'])
  })
})
