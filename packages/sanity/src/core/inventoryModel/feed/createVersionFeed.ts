import {type SanityClient} from '@sanity/client'
import {BehaviorSubject, combineLatest, type Observable, of, ReplaySubject, timer} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  share,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {listenQuery, type ListenQueryParams} from '../../store/document/listenQuery'
import {toVersionStub} from '../buildInventoryIndex'
import {type VersionStub} from '../types'
import {buildFeedGroupIdsQuery, buildFeedPageQuery} from './versionFeedQueries'

/**
 * The documents a feed should have live data for: rows `start` (inclusive) to `end` (exclusive)
 * of its document list.
 *
 * @internal
 */
export interface VersionFeedRange {
  start: number
  end: number
}

/**
 * @internal
 */
export interface VersionFeedOptions {
  /** GROQ filter that picks the feed's documents, for example `sanity::partOfVariant($variantId)`. */
  filter: string
  params?: ListenQueryParams
  /** Documents per page, and so per listener. */
  pageSize?: number
  /**
   * Pages kept live on each side of the visible range, so a short scroll finds its rows loaded.
   * The listener count is at most `2 + overscan * 2` pages beyond the visible ones, whatever
   * the document count.
   */
  overscanPages?: number
  tag?: string
  throttleTime?: number
}

/**
 * One page of documents, and its versions once they have loaded.
 *
 * @internal
 */
export interface VersionFeedPage {
  index: number
  groupIds: string[]
  /** `null` while the page is loading or after it failed. */
  versions: VersionStub[] | null
  error: Error | null
}

/**
 * @internal
 */
export interface VersionFeedState {
  /** Every document of the feed in list order, or `null` before the list has loaded. */
  groupIds: string[] | null
  /** The pages currently held live, in list order. Pages outside the window are dropped. */
  pages: VersionFeedPage[]
  /** The versions of every loaded page, ready for {@link buildInventoryIndex}. */
  versions: VersionStub[]
  loading: boolean
  error: Error | null
}

/**
 * @internal
 */
export interface VersionFeed {
  state$: Observable<VersionFeedState>
  /** Tells the feed which rows are on screen; it loads their pages and drops the rest. */
  setVisibleRange: (range: VersionFeedRange) => void
}

/** @internal */
export const DEFAULT_FEED_PAGE_SIZE = 50
/** @internal */
export const DEFAULT_FEED_OVERSCAN_PAGES = 1

/** @internal */
export const INITIAL_VERSION_FEED_STATE: VersionFeedState = {
  groupIds: null,
  pages: [],
  versions: [],
  loading: true,
  error: null,
}

/**
 * Which pages a range touches, plus the overscan on each side, clamped to the list.
 *
 * @internal
 */
export function getWindowPages({
  range,
  total,
  pageSize,
  overscanPages,
}: {
  range: VersionFeedRange
  total: number
  pageSize: number
  overscanPages: number
}): number[] {
  if (total === 0) return []
  const lastPage = Math.ceil(total / pageSize) - 1
  const first = Math.max(0, Math.floor(Math.max(0, range.start) / pageSize) - overscanPages)
  const lastVisible = Math.floor(Math.max(range.start, range.end - 1) / pageSize)
  const last = Math.min(lastPage, lastVisible + overscanPages)
  const pages: number[] = []
  for (let page = first; page <= last; page++) pages.push(page)
  return pages
}

/**
 * A live version feed that stays fast at scale (1,000+ documents, 10,000+ versions).
 *
 * - The document list is one ids-only query, kept fresh by one listener that only reacts when a
 *   document enters or leaves the feed (`appear` / `disappear`), not on every edit.
 * - Versions load a page of documents at a time: one fetch and one listener per page, like
 *   core's variant count hook keeps one listener for every variant. Never one observer per
 *   document.
 * - Only the pages around the visible range are held. A page that leaves the window closes its
 *   listener and drops its versions, so listener count and memory stay flat while scrolling.
 *   A page that stays in the window keeps its listener when the window moves.
 *
 * @internal
 */
export function createVersionFeed(client: SanityClient, options: VersionFeedOptions): VersionFeed {
  const {
    filter,
    params = {},
    pageSize = DEFAULT_FEED_PAGE_SIZE,
    overscanPages = DEFAULT_FEED_OVERSCAN_PAGES,
    tag = 'inventory.version-feed',
    throttleTime,
  } = options

  const range$ = new BehaviorSubject<VersionFeedRange>({start: 0, end: pageSize})

  const groupIds$: Observable<{groupIds: string[] | null; error: Error | null}> = listenQuery(
    client,
    buildFeedGroupIdsQuery(filter),
    params,
    {
      tag: `${tag}.documents`,
      perspective: 'raw',
      throttleTime,
      transitions: ['appear', 'disappear'],
    },
  ).pipe(
    map((ids: string[] | null) => ({groupIds: (ids ?? []).toSorted(), error: null})),
    catchError((error: Error) => of({groupIds: null, error})),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  // One shared stream per page, keyed by the page's documents. When the window moves, the pages
  // that stay are re-subscribed before the delayed reset fires, so their listeners stay open.
  const pageStreams = new Map<string, Observable<Omit<VersionFeedPage, 'index'>>>()
  const pageQuery = buildFeedPageQuery()

  function getPageStream(groupIds: string[]): Observable<Omit<VersionFeedPage, 'index'>> {
    const key = groupIds.join(',')
    const existing = pageStreams.get(key)
    if (existing) return existing

    const stream = listenQuery(
      client,
      pageQuery,
      {groupIds},
      {tag: `${tag}.page`, perspective: 'raw', throttleTime},
    ).pipe(
      map((documents: VersionInfoDocumentStub[] | null) => ({
        groupIds,
        versions: (documents ?? []).flatMap((document) => {
          const stub = toVersionStub(document)
          return stub ? [stub] : []
        }),
        error: null,
      })),
      startWith({groupIds, versions: null, error: null}),
      catchError((error: Error) => of({groupIds, versions: null, error})),
      finalize(() => pageStreams.delete(key)),
      share({
        connector: () => new ReplaySubject(1),
        resetOnRefCountZero: () => timer(0),
      }),
    )
    pageStreams.set(key, stream)
    return stream
  }

  const state$ = combineLatest([groupIds$, range$]).pipe(
    map(([{groupIds, error}, range]) => {
      const pages =
        groupIds === null
          ? []
          : getWindowPages({range, total: groupIds.length, pageSize, overscanPages}).map(
              (index) => ({
                index,
                groupIds: groupIds.slice(index * pageSize, (index + 1) * pageSize),
              }),
            )
      return {groupIds, error, pages}
    }),
    distinctUntilChanged(
      (previous, next) =>
        previous.groupIds === next.groupIds &&
        previous.error === next.error &&
        pagesKey(previous.pages) === pagesKey(next.pages),
    ),
    switchMap(({groupIds, error, pages}) => {
      if (pages.length === 0) {
        return of<VersionFeedState>({
          groupIds,
          pages: [],
          versions: [],
          loading: groupIds === null && error === null,
          error,
        })
      }

      return combineLatest(
        pages.map(({index, groupIds: pageGroupIds}) =>
          getPageStream(pageGroupIds).pipe(map((page) => ({...page, index}))),
        ),
      ).pipe(
        map((loadedPages): VersionFeedState => ({
          groupIds,
          pages: loadedPages,
          versions: loadedPages.flatMap((page) => page.versions ?? []),
          loading: loadedPages.some((page) => page.versions === null && page.error === null),
          error: error ?? loadedPages.find((page) => page.error)?.error ?? null,
        })),
      )
    }),
  )

  return {
    state$,
    setVisibleRange: (range) => {
      const current = range$.getValue()
      if (current.start !== range.start || current.end !== range.end) range$.next(range)
    },
  }
}

function pagesKey(pages: {index: number; groupIds: string[]}[]): string {
  return pages.map(({index, groupIds}) => `${index}:${groupIds.join(',')}`).join('|')
}
