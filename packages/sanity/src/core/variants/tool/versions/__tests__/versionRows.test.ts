import {describe, expect, it} from 'vitest'

import {buildInventoryIndex} from '../../../../inventoryModel/buildInventoryIndex'
import {type VersionStub} from '../../../../inventoryModel/types'
import {type VariantId} from '../../../types'
import {
  buildDocumentLensFilter,
  createVisibleRowTracker,
  DEFAULT_DEFINITION,
  filterVersions,
  getVersionLinkTarget,
  getVisibleRange,
  orderVersions,
  toDocumentLensRows,
  VERSION_INVENTORY_INSPECTOR_NAME,
  type VersionFilters,
} from '../versionRows'

const GERMAN = '_.variants.german' as VariantId
const SPRING = '_.releases.rSpring'

function row(overrides: Partial<VersionStub> & Pick<VersionStub, '_id' | 'groupId'>): VersionStub {
  return {
    _type: 'product',
    _updatedAt: '2026-11-01T00:00:00Z',
    variantId: undefined,
    kind: 'published',
    bundle: 'published',
    goingToUnpublish: false,
    ...overrides,
  }
}

// In the shared version order, as documentLens returns them.
const rows: VersionStub[] = [
  row({_id: 'boots', groupId: 'boots', _updatedAt: '2026-11-03T00:00:00Z'}),
  row({_id: 'jacket', groupId: 'jacket', _updatedAt: '2026-11-01T00:00:00Z'}),
  row({
    _id: 'drafts.jacket',
    groupId: 'jacket',
    kind: 'draft',
    bundle: 'drafts',
    _updatedAt: '2026-11-05T00:00:00Z',
  }),
  row({
    _id: 'versions.german.boots',
    groupId: 'boots',
    kind: 'draft',
    bundle: 'drafts',
    variantId: GERMAN,
    _updatedAt: '2026-11-04T00:00:00Z',
  }),
  row({
    _id: 'versions.rSpring.jacket',
    groupId: 'jacket',
    kind: 'release',
    bundle: SPRING,
    _updatedAt: '2026-11-02T00:00:00Z',
  }),
]

const ids = (list: VersionStub[]) => list.map((item) => item._id)

describe('filterVersions', () => {
  it('filters by definition, including Default', () => {
    expect(ids(filterVersions(rows, {definition: GERMAN}))).toEqual(['versions.german.boots'])
    expect(filterVersions(rows, {definition: DEFAULT_DEFINITION})).toHaveLength(4)
  })

  it('filters by release and by state, and combines filters', () => {
    expect(ids(filterVersions(rows, {release: SPRING}))).toEqual(['versions.rSpring.jacket'])
    expect(ids(filterVersions(rows, {state: 'draft'}))).toEqual([
      'drafts.jacket',
      'versions.german.boots',
    ])
    expect(ids(filterVersions(rows, {state: 'draft', definition: DEFAULT_DEFINITION}))).toEqual([
      'drafts.jacket',
    ])
  })
})

describe('orderVersions', () => {
  const jacket = rows.filter((item) => item.groupId === 'jacket')

  it('keeps the shared version order, or puts the last edit first', () => {
    expect(ids(orderVersions(jacket, 'version-order'))).toEqual(ids(jacket))
    expect(ids(orderVersions(jacket, 'last-edited'))).toEqual([
      'drafts.jacket',
      'versions.rSpring.jacket',
      'jacket',
    ])
  })
})

describe('toDocumentLensRows', () => {
  const index = buildInventoryIndex({versions: rows, releases: new Map()})

  it('lists loaded documents in feed order, with a placeholder for each unloaded one', () => {
    const result = toDocumentLensRows({
      groupIds: ['boots', 'hat', 'jacket'],
      index,
      filters: {},
      sort: 'version-order',
    })

    expect(ids(result)).toEqual([
      'boots',
      'versions.german.boots',
      'placeholder.hat',
      'jacket',
      'drafts.jacket',
      'versions.rSpring.jacket',
    ])
    expect(result[2]).toMatchObject({groupId: 'hat', placeholder: true})
  })

  it('keeps only the versions that match the filters', () => {
    const result = toDocumentLensRows({
      groupIds: ['boots', 'jacket'],
      index,
      filters: {state: 'draft'},
      sort: 'version-order',
    })
    expect(ids(result)).toEqual(['versions.german.boots', 'drafts.jacket'])
  })
})

describe('buildDocumentLensFilter', () => {
  it('reads content documents only when nothing is filtered', () => {
    expect(buildDocumentLensFilter({type: undefined, filters: {}})).toEqual({
      filter:
        '!(_id in path("_.**")) && !string::startsWith(_type, "sanity.") && ' +
        '!string::startsWith(_id, "versions.agent-")',
      params: {},
    })
  })

  it('narrows to documents with a version matching every filter', () => {
    const {filter, params} = buildDocumentLensFilter({
      type: 'product',
      filters: {definition: GERMAN, release: SPRING, state: 'release'},
    })
    expect(filter).toContain('_type == $type')
    expect(filter).toContain('sanity::partOfVariant($variantId)')
    expect(filter).toContain('defined(_system.release)')
    expect(params).toEqual({
      type: 'product',
      variantId: 'german',
      releaseRef: SPRING,
      releaseName: 'rSpring',
    })
  })

  it('matches a release by reference and by the release name in the id', () => {
    const {filter, params} = buildDocumentLensFilter({type: undefined, filters: {release: SPRING}})
    expect(filter).toContain(
      '(_system.release._ref == $releaseRef || _id in path("versions." + $releaseName + ".*"))',
    )
    expect(params).toEqual({releaseRef: SPRING, releaseName: 'rSpring'})
  })

  it('tells published from classic drafts and release versions by id', () => {
    const {filter} = buildDocumentLensFilter({type: undefined, filters: {state: 'published'}})
    expect(filter).toContain('!(_id in path("drafts.**"))')
    expect(filter).toContain(
      '(!(_id in path("versions.**")) || defined(_system.variants[0]) || defined(_system.variant))',
    )
  })

  it('matches plain release versions, which have no _system, by id', () => {
    const {filter} = buildDocumentLensFilter({type: undefined, filters: {state: 'release'}})
    expect(filter).toContain(
      '(defined(_system.release) || (_id in path("versions.**") && ' +
        '!defined(_system.variants[0]) && !defined(_system.variant)))',
    )
  })

  it('leaves agent versions out of every filter', () => {
    const filters: VersionFilters[] = [
      {},
      {definition: DEFAULT_DEFINITION},
      {state: 'published'},
      {state: 'draft'},
      {state: 'release'},
      {release: SPRING},
    ]
    for (const versionFilters of filters) {
      expect(buildDocumentLensFilter({type: undefined, filters: versionFilters}).filter).toContain(
        '!string::startsWith(_id, "versions.agent-")',
      )
    }
  })

  it('counts classic drafts as drafts', () => {
    const {filter} = buildDocumentLensFilter({type: undefined, filters: {state: 'draft'}})
    expect(filter).toContain('(_system.bundleId == "drafts" || _id in path("drafts.**"))')
  })

  it('reads Default as no definition', () => {
    expect(
      buildDocumentLensFilter({type: undefined, filters: {definition: DEFAULT_DEFINITION}}).filter,
    ).toContain('!defined(_system.variants[0]) && !defined(_system.variant)')
  })
})

describe('visible range', () => {
  it('covers the documents of the visible rows', () => {
    const groupIds = ['a', 'b', 'c', 'd', 'e']
    expect(getVisibleRange(groupIds, ['d', 'b', 'c'])).toEqual({start: 1, end: 4})
    expect(getVisibleRange(groupIds, ['unknown'])).toBeUndefined()
  })

  it('reports the mounted rows once per batch', () => {
    const reports: string[][] = []
    const flushes: (() => void)[] = []
    const tracker = createVisibleRowTracker(
      (groupIds) => reports.push(groupIds),
      (flush) => flushes.push(flush),
    )

    const untrackA = tracker.track('a')
    tracker.track('a')
    tracker.track('b')
    expect(flushes).toHaveLength(1)
    flushes[0]!()
    expect(reports).toEqual([['a', 'b']])

    // A document stays visible while any of its rows is mounted.
    untrackA()
    flushes[1]!()
    expect(reports.at(-1)).toEqual(['a', 'b'])
  })
})

describe('getVersionLinkTarget', () => {
  it('opens the document on the version, with the version inventory open', () => {
    const published = getVersionLinkTarget(rows[1]!)
    expect(published.params).toEqual({
      id: 'jacket',
      type: 'product',
      inspect: VERSION_INVENTORY_INSPECTOR_NAME,
    })
    expect(published.searchParams).toEqual([['perspective', 'published']])

    expect(getVersionLinkTarget(rows[2]!).searchParams).toEqual([])

    const inRelease = getVersionLinkTarget(rows[4]!)
    expect(inRelease.searchParams).toEqual([['perspective', 'rSpring']])
    expect(inRelease.perspectiveStack).toEqual(['rSpring', 'drafts'])

    expect(getVersionLinkTarget(rows[3]!).searchParams).toEqual([['variant', 'variant:german']])
  })

  it('names the same inspector as the structure document pane', () => {
    expect(VERSION_INVENTORY_INSPECTOR_NAME).toBe('sanity/structure/document-group')
  })
})
