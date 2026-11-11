import {evaluate, parse} from 'groq-js'
import {describe, expect, it} from 'vitest'

import {
  buildInventoryIndex,
  toVersionStub,
  type VersionStubSource,
} from '../../../../inventoryModel/buildInventoryIndex'
import {type VersionStub} from '../../../../inventoryModel/types'
import {EXCLUDE_AGENT_VERSIONS_FILTER} from '../../../../search/constants'
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

describe('raw version shapes', () => {
  // The shapes Content Lake returns today: only variant versions carry `_system.group`.
  function raw(id: string, system: VersionStubSource['_system']): VersionStubSource {
    return {_id: id, _type: 'product', _updatedAt: '2026-11-01T00:00:00Z', _system: system}
  }
  const index = buildInventoryIndex({
    versions: [
      raw('boots', {base: {id: 'boots', rev: 'r1'}} as VersionStubSource['_system']),
      raw('drafts.boots', null),
      raw('versions.rSpring.boots', null),
      raw('versions.agent-12334.boots', {
        base: {id: 'boots', rev: 'r1'},
      } as VersionStubSource['_system']),
    ].flatMap((source) => {
      const stub = toVersionStub(source)
      return stub ? [stub] : []
    }),
    releases: new Map(),
  })
  const rowsFor = (filters: Parameters<typeof toDocumentLensRows>[0]['filters']) =>
    ids(toDocumentLensRows({groupIds: ['boots'], index, filters, sort: 'version-order'}))

  it('lists the classic draft and the plain release version, without the agent version', () => {
    expect(rowsFor({})).toEqual(['boots', 'drafts.boots', 'versions.rSpring.boots'])
  })

  it('keeps them through the Drafts, In a release and Release filters', () => {
    expect(rowsFor({state: 'draft'})).toEqual(['drafts.boots'])
    expect(rowsFor({state: 'release'})).toEqual(['versions.rSpring.boots'])
    expect(rowsFor({release: SPRING})).toEqual(['versions.rSpring.boots'])
    expect(rowsFor({state: 'published'})).toEqual(['boots'])
    expect(rowsFor({definition: DEFAULT_DEFINITION})).toEqual([
      'boots',
      'drafts.boots',
      'versions.rSpring.boots',
    ])
  })
})

describe('buildDocumentLensFilter', () => {
  it('reads content documents only when nothing is filtered', () => {
    expect(buildDocumentLensFilter({type: undefined, filters: {}})).toEqual({
      filter:
        '!(_id in path("_.**")) && !string::startsWith(_type, "sanity.") && ' +
        EXCLUDE_AGENT_VERSIONS_FILTER,
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
      '(_system.release._ref == $releaseRef || _id in path("versions." + $releaseName + ".**"))',
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
        EXCLUDE_AGENT_VERSIONS_FILTER,
      )
    }
  })

  it('counts classic drafts as drafts', () => {
    const {filter} = buildDocumentLensFilter({type: undefined, filters: {state: 'draft'}})
    expect(filter).toContain('(_system.bundleId == "drafts" || _id in path("drafts.**"))')
  })

  it('matches plain release versions of dotted ids and leaves out opaque agent versions', async () => {
    const dataset = [
      {_id: 'versions.rSpring.boots', _type: 'product', _system: null},
      {_id: 'versions.rSpring.boots.winter', _type: 'product', _system: null},
      {_id: 'versions.agent-12334.boots', _type: 'product'},
      // A variant-scoped agent version: the id is an opaque scope hash, the bundle is in _system.
      {
        _id: 'versions.a1b2c3.boots',
        _type: 'product',
        _system: {bundleId: 'agent-12334', group: {_ref: 'boots', _weak: true}},
      },
    ]
    const query = async (filters: VersionFilters) => {
      const {filter, params} = buildDocumentLensFilter({type: undefined, filters})
      const result = await evaluate(parse(`*[${filter}]._id`, {params}), {dataset, params})
      return result.get()
    }

    expect(await query({})).toEqual(['versions.rSpring.boots', 'versions.rSpring.boots.winter'])
    expect(await query({release: SPRING})).toEqual([
      'versions.rSpring.boots',
      'versions.rSpring.boots.winter',
    ])
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
      (flush) => {
        flushes.push(flush)
        return () => {}
      },
    )
    tracker.start()

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

  it('reports nothing once stopped, and what changed meanwhile when started again', () => {
    const reports: string[][] = []
    const pending = new Set<() => void>()
    const tracker = createVisibleRowTracker(
      (groupIds) => reports.push(groupIds),
      (flush) => {
        pending.add(flush)
        return () => pending.delete(flush)
      },
    )

    // Rows mount before their parent's effect starts the tracker.
    const untrack = tracker.track('a')
    expect(pending.size).toBe(0)
    const stop = tracker.start()
    expect(pending.size).toBe(1)

    // Unmounting cancels the pending report, and rows that unmount after it schedule nothing.
    stop()
    untrack()
    expect(pending.size).toBe(0)
    expect(reports).toEqual([])

    tracker.start()
    for (const flush of pending) flush()
    expect(reports).toEqual([[]])
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
    expect(published.searchParams).toEqual([
      ['variant', ''],
      ['perspective', 'published'],
    ])

    const inRelease = getVersionLinkTarget(rows[4]!)
    expect(inRelease.searchParams).toEqual(expect.arrayContaining([['perspective', 'rSpring']]))
    expect(inRelease.perspectiveStack).toEqual(['rSpring', 'drafts'])
  })

  it('sets the sticky variant and perspective on every row, clearing them when the row has none', () => {
    // A Default draft: no variant, and the drafts perspective (no perspective param).
    expect(getVersionLinkTarget(rows[2]!).searchParams).toEqual([
      ['variant', ''],
      ['perspective', ''],
    ])
    // A variant draft.
    expect(getVersionLinkTarget(rows[3]!).searchParams).toEqual([
      ['variant', 'variant:german'],
      ['perspective', ''],
    ])
  })

  it('names the same inspector as the structure document pane', () => {
    expect(VERSION_INVENTORY_INSPECTOR_NAME).toBe('sanity/structure/document-group')
  })
})
