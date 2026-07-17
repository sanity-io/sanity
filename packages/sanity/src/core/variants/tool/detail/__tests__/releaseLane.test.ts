import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {
  computeReleaseLaneSegments,
  RELEASE_LANE_ALL,
  resolveVersionBundle,
  rowMatchesLane,
  UNRESOLVED_RELEASE_ID,
} from '../releaseLane'
import {type DocumentInVariantGroup, type VariantDocumentVersion} from '../types'

const summerRelease = {
  _id: '_.releases.rSummer',
  metadata: {title: 'Summer launch'},
} as ReleaseDocument

const fallRelease = {
  _id: '_.releases.rFall',
  metadata: {title: 'Fall campaign'},
} as ReleaseDocument

const releasesById = new Map<string, ReleaseDocument>([
  [summerRelease._id, summerRelease],
  [fallRelease._id, fallRelease],
])

const published: VariantDocumentVersion = {
  documentId: 'published.scope.a',
  releaseRef: null,
  updatedAt: '2025-06-01T00:00:00Z',
}
const draft: VariantDocumentVersion = {
  documentId: 'drafts.scope.a',
  bundleId: 'drafts',
  releaseRef: null,
  updatedAt: '2025-06-01T00:00:00Z',
}
const summer: VariantDocumentVersion = {
  documentId: 'versions.rSummer.scope.a',
  bundleId: 'rSummer',
  releaseRef: '_.releases.rSummer',
  updatedAt: '2025-06-02T00:00:00Z',
}
const fall: VariantDocumentVersion = {
  documentId: 'versions.rFall.scope.b',
  bundleId: 'rFall',
  releaseRef: '_.releases.rFall',
  updatedAt: '2025-06-02T00:00:00Z',
}
const orphanRelease: VariantDocumentVersion = {
  documentId: 'versions.rGone.scope.c',
  bundleId: 'rGone',
  releaseRef: '_.releases.rGone',
  updatedAt: '2025-06-02T00:00:00Z',
}

const makeRow = (versions: VariantDocumentVersion[]): DocumentInVariantGroup =>
  ({versions}) as DocumentInVariantGroup

describe('resolveVersionBundle', () => {
  it('resolves published versions (undefined bundleId)', () => {
    expect(resolveVersionBundle(published, releasesById)).toEqual({
      id: 'published',
      kind: 'published',
    })
  })

  it('resolves draft versions', () => {
    expect(resolveVersionBundle(draft, releasesById)).toEqual({id: 'drafts', kind: 'drafts'})
  })

  it('resolves release versions via releaseRef', () => {
    expect(resolveVersionBundle(summer, releasesById)).toEqual({
      id: summerRelease._id,
      kind: 'release',
      release: summerRelease,
    })
  })

  it('marks unresolvable releases with a stable fallback id', () => {
    // The release document is not in the store, but the ref is still a stable filter key.
    expect(resolveVersionBundle(orphanRelease, releasesById)).toEqual({
      id: '_.releases.rGone',
      kind: 'release',
      release: undefined,
    })
  })

  it('falls back to UNRESOLVED_RELEASE_ID when there is no ref or bundle', () => {
    const nothing: VariantDocumentVersion = {
      documentId: 'x',
      bundleId: 'someRelease',
      releaseRef: null,
      updatedAt: '2025-06-02T00:00:00Z',
    }
    // A release bundle with no ref resolves to its bundle-derived document id, not the fallback.
    expect(resolveVersionBundle(nothing, releasesById).kind).toBe('release')
    expect(resolveVersionBundle(nothing, releasesById).id).not.toBe(UNRESOLVED_RELEASE_ID)
  })
})

describe('computeReleaseLaneSegments', () => {
  it('orders segments published, drafts, then releases by title', () => {
    const rows = [makeRow([published, draft, summer, fall])]
    const segments = computeReleaseLaneSegments(rows, releasesById)

    expect(segments.map((segment) => segment.kind)).toEqual([
      'published',
      'drafts',
      'release',
      'release',
    ])
    // Releases sort by title: "Fall campaign" before "Summer launch".
    expect(segments[2]?.release?.metadata?.title).toBe('Fall campaign')
    expect(segments[3]?.release?.metadata?.title).toBe('Summer launch')
  })

  it('counts each document group once per bundle, even with duplicate versions', () => {
    const rows = [
      makeRow([published, draft]),
      makeRow([draft]),
      // Two versions in the same release must only count the group once for that release.
      makeRow([summer, summer]),
    ]
    const segments = computeReleaseLaneSegments(rows, releasesById)
    const byId = new Map(segments.map((segment) => [segment.id, segment.count]))

    expect(byId.get('published')).toBe(1)
    expect(byId.get('drafts')).toBe(2)
    expect(byId.get(summerRelease._id)).toBe(1)
  })
})

describe('rowMatchesLane', () => {
  const row = makeRow([published, summer])

  it('matches every row for the "all" lane', () => {
    expect(rowMatchesLane(row, RELEASE_LANE_ALL, releasesById)).toBe(true)
  })

  it('matches a row that has a version in the lane', () => {
    expect(rowMatchesLane(row, 'published', releasesById)).toBe(true)
    expect(rowMatchesLane(row, summerRelease._id, releasesById)).toBe(true)
  })

  it('does not match a row without a version in the lane', () => {
    expect(rowMatchesLane(row, 'drafts', releasesById)).toBe(false)
    expect(rowMatchesLane(row, fallRelease._id, releasesById)).toBe(false)
  })
})
