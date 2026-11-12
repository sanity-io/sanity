import {type SanityClient} from '@sanity/client'
import {Observable, of, Subject, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type MutationEvent} from '../../../store/document/types'
import {type VersionStubSource} from '../../buildInventoryIndex'
import {
  createVersionFeed,
  getWindowPages,
  type VersionFeedOptions,
  type VersionFeedState,
} from '../createVersionFeed'
import {buildFeedGroupIdsQuery, buildFeedPageQuery} from '../versionFeedQueries'

const DOCUMENT_COUNT = 1240
const RELEASES_PER_DOCUMENT = 10

function groupId(index: number): string {
  return `doc-${String(index).padStart(4, '0')}`
}

type RawVersion = VersionStubSource & {_rev: string; _createdAt: string}

function raw(id: string, system: RawVersion['_system']): RawVersion {
  const document: RawVersion = {
    _id: id,
    _rev: 'rev',
    _type: 'product',
    _createdAt: '2026-11-01T00:00:00Z',
    _updatedAt: '2026-11-01T00:00:00Z',
  }
  // A missing `_system` key and `_system: null` both occur in raw query results.
  return system === undefined ? document : {...document, _system: system}
}

// `base` is not part of the typed _system, as in a raw query result.
function publishedSystem(id: string) {
  const system = {base: {id, rev: 'rev'}}
  return system
}

// The shapes Content Lake returns today, where only variant versions carry `_system.group`: a
// published document (`_system: {base}`), a classic draft (`_system: null`), ten release versions
// without `_system`, and one variant draft with the full `_system`. 1,240 documents, 16,120
// versions.
function versionsOf(group: string): RawVersion[] {
  return [
    raw(group, publishedSystem(group)),
    raw(`drafts.${group}`, null),
    ...Array.from({length: RELEASES_PER_DOCUMENT}, (_, release) =>
      raw(`versions.r${release}.${group}`, undefined),
    ),
    raw(`drafts.scopeDe.${group}`, {
      group: {_ref: group, _weak: true},
      bundleId: 'drafts',
      variants: [{_ref: '_.variants.german', _key: 'k'}],
    }),
  ]
}

const VERSIONS_PER_DOCUMENT = 2 + RELEASES_PER_DOCUMENT + 1

function pageGroupIds(params: Record<string, unknown>): string[] {
  return Object.keys(params)
    .filter((key) => /^g\d+$/.test(key))
    .toSorted((left, right) => Number(left.slice(1)) - Number(right.slice(1)))
    .map((key) => String(params[key]))
}

function isPageQuery(query: string): boolean {
  return query.startsWith('*[sanity::versionOf(')
}

const GROUP_IDS_QUERY = buildFeedGroupIdsQuery('_type == "product"')

/**
 * A client whose listeners are tracked: how many are open, for which query, and a way to push a
 * mutation into each. Fetches answer from an in-memory dataset.
 */
function createMockClient() {
  const dataset = new Map<string, RawVersion[]>()
  for (let index = DOCUMENT_COUNT - 1; index >= 0; index--) {
    dataset.set(groupId(index), versionsOf(groupId(index)))
  }

  const open = new Set<{query: string; params: Record<string, unknown>; events: Subject<unknown>}>()
  let opened = 0
  let failFetch = false

  const fetch = vi.fn((query: string, params: Record<string, unknown>) => {
    if (failFetch) return throwError(() => new Error('fetch failed'))
    if (query === GROUP_IDS_QUERY.fetch) return of([...dataset.keys()])
    if (isPageQuery(query)) {
      return of(pageGroupIds(params).flatMap((group) => dataset.get(group) ?? []))
    }
    return throwError(() => new Error(`unexpected query ${query}`))
  })

  const client = {
    withConfig: vi.fn(function withConfig(this: unknown) {
      return this
    }),
    observable: {fetch},
    listen: vi.fn(
      (query: string, params: Record<string, unknown>) =>
        new Observable((subscriber) => {
          const listener = {query, params, events: new Subject<unknown>()}
          open.add(listener)
          opened++
          const subscription = listener.events.subscribe(subscriber)
          // Like a real EventSource, the welcome event arrives after the subscription is set up.
          const welcome = setTimeout(() => subscriber.next({type: 'welcome', listenerName: 'test'}))
          return () => {
            clearTimeout(welcome)
            open.delete(listener)
            subscription.unsubscribe()
          }
        }),
    ),
  }

  return {
    client: client as unknown as SanityClient,
    dataset,
    fetch,
    open,
    get opened() {
      return opened
    },
    failFetches: () => {
      failFetch = true
    },
    pageListeners: () => [...open].filter(({query}) => isPageQuery(query)),
  }
}

function mutation(documentId: string, transition: MutationEvent['transition']): MutationEvent {
  return {
    type: 'mutation',
    documentId,
    transactionId: 'tx',
    mutations: [],
    effects: {apply: [], revert: []},
    previousRev: 'a',
    resultRev: 'b',
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
    messageReceivedAt: '2026-11-10T00:00:00Z',
    visibility: 'query',
    transition,
  }
}

function startFeed(
  mock: ReturnType<typeof createMockClient>,
  options: Partial<VersionFeedOptions> = {},
) {
  const feed = createVersionFeed(mock.client, {
    filter: '_type == "product"',
    pageSize: 50,
    overscanPages: 0,
    ...options,
  })
  const states: VersionFeedState[] = []
  const subscription = feed.state$.subscribe((state) => states.push(state))
  return {feed, subscription, latest: () => states[states.length - 1]}
}

async function flush() {
  // listenQuery schedules refetches on the async scheduler, and a dropped page resets a tick
  // after its last subscriber leaves.
  await vi.advanceTimersByTimeAsync(5)
}

describe('getWindowPages', () => {
  it('covers the visible range and the overscan, clamped to the list', () => {
    expect(
      getWindowPages({range: {start: 0, end: 20}, total: 1240, pageSize: 50, overscanPages: 1}),
    ).toEqual([0, 1])
    expect(
      getWindowPages({range: {start: 120, end: 160}, total: 1240, pageSize: 50, overscanPages: 1}),
    ).toEqual([1, 2, 3, 4])
    expect(
      getWindowPages({
        range: {start: 1230, end: 1260},
        total: 1240,
        pageSize: 50,
        overscanPages: 1,
      }),
    ).toEqual([23, 24])
    expect(
      getWindowPages({range: {start: 0, end: 20}, total: 0, pageSize: 50, overscanPages: 1}),
    ).toEqual([])
  })
})

describe('createVersionFeed', () => {
  let mock: ReturnType<typeof createMockClient>

  beforeEach(() => {
    vi.useFakeTimers()
    mock = createMockClient()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the document list and the first page only, with one listener each', async () => {
    const {subscription, latest} = startFeed(mock)
    await flush()

    const state = latest()
    expect(state.groupIds).toHaveLength(DOCUMENT_COUNT)
    // Sorted by group id, whatever order the query answered in.
    expect(state.groupIds?.slice(0, 2)).toEqual([groupId(0), groupId(1)])
    expect(state.pages.map(({index}) => index)).toEqual([0])
    expect(state.versions).toHaveLength(50 * VERSIONS_PER_DOCUMENT)
    expect(state.loading).toBe(false)
    expect(mock.open.size).toBe(2)
    expect(mock.opened).toBe(2)

    // The page asks for its documents by group id, and only those.
    const pageFetch = mock.fetch.mock.calls.find(([query]) => isPageQuery(query))
    expect(pageFetch?.[0]).toBe(buildFeedPageQuery(pageGroupIds(pageFetch?.[1] ?? {})).fetch)
    expect(pageGroupIds(pageFetch?.[1] ?? {})).toEqual(
      Array.from({length: 50}, (_, index) => groupId(index)),
    )
    // Every version of every document is read, though only the variant draft stores its group.
    expect(state.versions.filter(({kind}) => kind === 'published')).toHaveLength(50)
    expect(state.versions.filter(({kind}) => kind === 'draft')).toHaveLength(100)
    expect(state.versions.filter(({kind}) => kind === 'release')).toHaveLength(
      50 * RELEASES_PER_DOCUMENT,
    )
    expect(new Set(state.versions.map(({groupId: group}) => group)).size).toBe(50)

    subscription.unsubscribe()
    await flush()
    expect(mock.open.size).toBe(0)
  })

  it('keeps listener count and loaded versions flat while scrolling through every document', async () => {
    const {feed, subscription, latest} = startFeed(mock, {overscanPages: 1})
    await flush()

    const listenerCounts: number[] = []
    const versionCounts: number[] = []
    for (let start = 0; start < DOCUMENT_COUNT; start += 20) {
      feed.setVisibleRange({start, end: start + 20})
      // oxlint-disable-next-line no-await-in-loop -- each scroll step must settle before the next
      await flush()
      listenerCounts.push(mock.open.size)
      versionCounts.push(latest().versions.length)
    }

    // One list listener, plus at most the visible pages (two at a page boundary) and one
    // overscan page each side.
    expect(Math.max(...listenerCounts)).toBeLessThanOrEqual(1 + 4)
    expect(Math.max(...versionCounts)).toBeLessThanOrEqual(4 * 50 * VERSIONS_PER_DOCUMENT)
    // The last page is loaded at the end, and the first pages are long gone.
    expect(latest().pages.map(({index}) => index)).toEqual([23, 24])
    expect(latest().versions.some((stub) => stub.groupId === groupId(0))).toBe(false)
    expect(latest().versions.some((stub) => stub.groupId === groupId(DOCUMENT_COUNT - 1))).toBe(
      true,
    )

    subscription.unsubscribe()
  })

  it('keeps the listener of a page that stays in the window', async () => {
    const {feed, subscription} = startFeed(mock)
    feed.setVisibleRange({start: 40, end: 60})
    await flush()
    const pageOneListener = mock
      .pageListeners()
      .find(({params}) => pageGroupIds(params)[0] === groupId(50))
    expect(pageOneListener).toBeDefined()
    const openedBefore = mock.opened

    feed.setVisibleRange({start: 60, end: 110})
    await flush()

    expect(mock.pageListeners()).toContain(pageOneListener)
    // Only page 2 is new; page 0 closed.
    expect(mock.opened).toBe(openedBefore + 1)
    expect(mock.pageListeners()).toHaveLength(2)

    subscription.unsubscribe()
  })

  it('updates a page live when one of its documents changes', async () => {
    const {subscription, latest} = startFeed(mock)
    await flush()

    const group = groupId(3)
    mock.dataset.set(group, [...versionsOf(group), raw(`versions.rNew.${group}`, undefined)])
    const [pageListener] = mock.pageListeners()
    pageListener.events.next(mutation(`versions.rNew.${group}`, 'appear'))
    await flush()

    expect(latest().versions.filter((stub) => stub.groupId === group)).toHaveLength(
      VERSIONS_PER_DOCUMENT + 1,
    )
    // Live, not reloaded: still one list listener and one page listener.
    expect(mock.open.size).toBe(2)

    subscription.unsubscribe()
  })

  it('refreshes the document list when a document enters the feed, not on edits', async () => {
    const {subscription, latest} = startFeed(mock)
    await flush()
    const listListener = [...mock.open].find(({query}) => query === GROUP_IDS_QUERY.listen)
    const listFetches = () =>
      mock.fetch.mock.calls.filter(([query]) => query === GROUP_IDS_QUERY.fetch).length
    const before = listFetches()

    listListener?.events.next(mutation(groupId(5), 'update'))
    await flush()
    expect(listFetches()).toBe(before)

    mock.dataset.set('doc-new', versionsOf('doc-new'))
    listListener?.events.next(mutation('doc-new', 'appear'))
    await flush()
    expect(listFetches()).toBe(before + 1)
    expect(latest().groupIds).toHaveLength(DOCUMENT_COUNT + 1)

    subscription.unsubscribe()
  })

  it('reports loading while the document list loads', async () => {
    const {subscription, latest} = startFeed(mock)

    // Before the list query answers.
    expect(latest()).toEqual({groupIds: null, pages: [], versions: [], loading: true, error: null})

    await flush()
    expect(latest().loading).toBe(false)

    subscription.unsubscribe()
  })

  it('reports an error instead of throwing when the list fails to load', async () => {
    mock.failFetches()
    const {subscription, latest} = startFeed(mock)
    await flush()

    expect(latest()).toMatchObject({groupIds: null, loading: false, pages: []})
    expect(latest().error?.message).toBe('fetch failed')

    subscription.unsubscribe()
  })
})
