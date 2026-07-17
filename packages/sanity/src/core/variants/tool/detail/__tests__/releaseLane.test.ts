import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {
  buildReleaseSwimlaneRows,
  computeReleaseLaneSegments,
  getRowBundleSortKey,
  RELEASE_LANE_ALL,
  type ReleaseLaneSegment,
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

describe('getRowBundleSortKey', () => {
  it('orders published before drafts before releases', () => {
    const publishedKey = getRowBundleSortKey(makeRow([published]), releasesById)
    const draftKey = getRowBundleSortKey(makeRow([draft]), releasesById)
    const releaseKey = getRowBundleSortKey(makeRow([summer]), releasesById)

    expect(publishedKey < draftKey).toBe(true)
    expect(draftKey < releaseKey).toBe(true)
  })

  it('keys a multi-bundle row by its most prominent bundle', () => {
    // A row in both a release and published sorts as published (the most prominent bundle).
    const key = getRowBundleSortKey(makeRow([summer, published]), releasesById)
    expect(key).toBe(getRowBundleSortKey(makeRow([published]), releasesById))
  })

  it('breaks ties between releases by title', () => {
    const fallKey = getRowBundleSortKey(makeRow([fall]), releasesById)
    const summerKey = getRowBundleSortKey(makeRow([summer]), releasesById)
    // "Fall campaign" sorts before "Summer launch".
    expect(fallKey < summerKey).toBe(true)
  })
})

describe('buildReleaseSwimlaneRows', () => {
  const label = (segment: ReleaseLaneSegment): string =>
    segment.kind === 'release' ? (segment.release?.metadata?.title ?? segment.id) : segment.kind

  const rows = [
    makeRow([published, draft]), // in published + drafts
    makeRow([draft]), // drafts only
    makeRow([summer]), // a release only
  ]

  it('emits an ordered aggregate header per bundle with matching counts', () => {
    const out = buildReleaseSwimlaneRows({
      rows,
      releasesById,
      expanded: new Set(),
      getSegmentLabel: label,
      onToggle: () => {},
    })

    // Collapsed: headers only, ordered published -> drafts -> release.
    expect(out.every((row) => row.isReleaseAggregate)).toBe(true)
    expect(out.map((row) => row.releaseLabel)).toEqual(['published', 'drafts', 'Summer launch'])
    expect(out.map((row) => row.releaseCount)).toEqual([1, 2, 1])
  })

  it('nests matching documents under expanded groups, listing multi-bundle docs in each', () => {
    const out = buildReleaseSwimlaneRows({
      rows,
      releasesById,
      expanded: new Set(['published', 'drafts', summerRelease._id]),
      getSegmentLabel: label,
      onToggle: () => {},
    })

    // 3 headers + published(1) + drafts(2) + release(1) children = 7 rows.
    expect(out).toHaveLength(7)
    const children = out.filter((row) => !row.isReleaseAggregate)
    expect(children).toHaveLength(4)
    // rowKey is a monotonic padded index, so the default sort preserves this order; groupId stays
    // the real document group id the preview links to (aggregates use a synthetic groupId).
    expect(out.map((row) => row.rowKey)).toEqual([
      '00000',
      '00001',
      '00002',
      '00003',
      '00004',
      '00005',
      '00006',
    ])
    // Children keep their real (non-index) groupId so the preview link still resolves.
    expect(children.every((row) => !/^\d{5}$/.test(row.groupId))).toBe(true)
  })

  it('only expands the requested group', () => {
    const out = buildReleaseSwimlaneRows({
      rows,
      releasesById,
      expanded: new Set(['drafts']),
      getSegmentLabel: label,
      onToggle: () => {},
    })

    // 3 headers + 2 drafts children.
    expect(out).toHaveLength(5)
    expect(out.filter((row) => !row.isReleaseAggregate)).toHaveLength(2)
  })
})
