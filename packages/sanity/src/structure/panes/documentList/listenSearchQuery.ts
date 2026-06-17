import {type ClientPerspective, type SanityClient} from '@sanity/client'
import {
  asyncScheduler,
  defer,
  filter,
  map,
  merge,
  mergeMap,
  type Observable,
  of,
  partition,
  share,
  throttleTime,
  throwError,
  timer,
} from 'rxjs'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {scan} from 'rxjs/operators'
import {
  compileFieldPath,
  createSearch,
  createSWR,
  getSearchableTypes,
  type SanityDocumentLike,
  type Schema,
  type SearchOptions,
  type SearchSort,
  type SearchStrategy,
} from 'sanity'

import {toStaticSortOrder} from './helpers'
import {type SortOrder} from './types'

interface ListenQueryOptions {
  client: SanityClient
  filter: string
  limit: number
  params: Record<string, unknown>
  schema: Schema
  searchQuery: string
  sort: SortOrder
  perspective?: ClientPerspective
  staticTypeNames?: string[] | null
  maxFieldDepth?: number
  searchStrategy?: SearchStrategy
  /**
   * Whether to rank results by relevance when a search term is present.
   * Defaults to `true`. See {@link resolveSearchOrdering}.
   */
  sortByRelevance?: boolean
}

export type SearchQueryEvent =
  | {
      type: 'reconnect'
    }
  | {type: 'result'; documents: SanityDocumentLike[]}

export interface SearchQueryState {
  connected: boolean
  fromCache: boolean
  documents: SanityDocumentLike[]
}

const swr = createSWR<{connected: boolean; documents: SanityDocumentLike[]}>({maxSize: 100})

/**
 * Resolve the score/sort options for a list pane search request.
 *
 * When a search term is present, results are ranked by relevance so the most
 * relevant documents surface first (matching the behaviour of global search).
 * The configured/selected sort order is preserved as a tiebreaker. With an
 * empty query there are no scores to sort by, so the configured order is kept
 * untouched.
 *
 * The two search strategies express relevance differently:
 * - `groq2024` is driven by the presence of a `_score` sort entry, which
 *   activates the server-side `score(boost(...))` pipeline.
 * - `groqLegacy` computes scores client-side and sorts by them unless
 *   `skipSortByScore` is set.
 *
 * @internal
 */
export function resolveSearchOrdering(options: {
  searchQuery: string
  sortBy: SearchSort[]
  searchStrategy?: SearchStrategy
  /**
   * Whether to rank by relevance when a search term is present. Defaults to
   * `true`. Set to `false` when the editor has explicitly chosen one of the
   * configured orderings instead of relevance.
   */
  useRelevance?: boolean
}): {skipSortByScore: boolean; sort: SearchSort[]} {
  const {searchQuery, sortBy, searchStrategy, useRelevance = true} = options
  const sortByRelevance = Boolean(searchQuery) && useRelevance

  if (!sortByRelevance) {
    return {skipSortByScore: true, sort: sortBy}
  }

  // `groqLegacy` cannot order by a projected `_score` field, so it relies on
  // client-side score sorting (`skipSortByScore: false`) with the configured
  // order kept as a tiebreaker. `groq2024` ranks by relevance by prepending a
  // `_score` sort entry.
  if (searchStrategy === 'groqLegacy') {
    return {skipSortByScore: false, sort: sortBy}
  }

  return {
    skipSortByScore: false,
    sort: [{field: '_score', direction: 'desc'}, ...sortBy],
  }
}

export function listenSearchQuery(options: ListenQueryOptions): Observable<SearchQueryState> {
  const {
    client,
    schema,
    sort,
    perspective,
    limit,
    params,
    filter: groqFilter,
    searchQuery,
    staticTypeNames,
    sortByRelevance,
    maxFieldDepth,
    searchStrategy,
  } = options
  const sortBy = sort.by

  // Listen for changes with the given filter and params, and whenever a change occurs, we want to
  // re-fetch the documents that match the search query (see below).
  // We use a separate listener since the search query is too large to use in a listen query.
  const events$ = defer(() => {
    return client.listen(`*[${groqFilter}]`, params, {
      events: ['welcome', 'mutation', 'reconnect'],
      includeAllVersions: true,
      includeResult: false,
      visibility: 'query',
      tag: 'listen-search-query',
    })
  }).pipe(
    mergeMap((ev, i) => {
      const isFirst = i === 0
      // If we can't establish a connection to the /listen endpoint, the first event we receive will be 'reconnect'
      // So if we get "reconnect" as the first event actually means "Connection can't be established"
      if (isFirst && ev.type === 'reconnect') {
        // if it's neither welcome nor reconnect, something unexpected has happened.
        return throwError(() => new Error(`Failed to establish EventSource connection`))
      }
      // When a connection is successfully established, the first event will be 'welcome'
      if (isFirst && ev.type !== 'welcome') {
        // if it's neither welcome nor reconnect, something unexpected has happened.
        return throwError(() => new Error(`Received unexpected type of first event "${ev.type}"`))
      }
      return of(ev)
    }),
    share(),
  )

  const [welcome$, mutationAndReconnect$] = partition(events$, (ev) => ev.type === 'welcome')

  const swrKey = JSON.stringify({
    fiilter: groqFilter,
    limit,
    params,
    searchQuery,
    perspective,
    sort: toStaticSortOrder(sort),
    staticTypeNames,
  })

  return merge(
    welcome$,
    mutationAndReconnect$.pipe(throttleTime(1000, asyncScheduler, {leading: true, trailing: true})),
  ).pipe(
    exhaustMapWithTrailing((event): Observable<SearchQueryEvent> => {
      // Get the types names to use for searching.
      // If we have a static list of types, we can skip fetching the types and use the static list.
      const typeNames$ = staticTypeNames
        ? of(staticTypeNames)
        : client.observable.fetch(`array::unique(*[${groqFilter}][]._type)`, params)

      // Use the type names to create a search query and fetch the documents that match the query.
      return typeNames$.pipe(
        mergeMap((typeNames: string[]) => {
          const types = getSearchableTypes(schema, staticTypeNames || []).filter((type) => {
            if (typeNames.includes(type.name)) {
              // Validate every sort field against the schema in strict
              // mode. `compileFieldPath` throws an `Error` for unknown
              // fields, paths into non-object types, range slices,
              // multi-type array access, etc.
              for (const entry of sort.by) {
                if (!entry.field) {
                  continue
                }
                compileFieldPath(type, entry.field, {strict: true})
              }
              return true
            }
            return false
          })

          const search = createSearch(types, client, {
            filter: groqFilter,
            params,
            strategy: searchStrategy,
            maxDepth: maxFieldDepth,
          })

          const doFetch = () => {
            const searchTerms = {
              query: searchQuery || '',
              types,
            }

            const {skipSortByScore, sort} = resolveSearchOrdering({
              searchQuery: searchQuery || '',
              sortBy,
              searchStrategy,
              useRelevance: sortByRelevance,
            })

            const searchOptions: SearchOptions = {
              comments: [`findability-source: ${searchQuery ? 'list-query' : 'list'}`],
              limit,
              skipSortByScore,
              sort,
              perspective,
            }

            return search(searchTerms, searchOptions).pipe(
              map((result) => result.hits.map(({hit}) => hit)),
              map((hits) => ({type: 'result' as const, documents: hits})),
            )
          }

          if (event.type === 'mutation' && event.visibility !== 'query') {
            // Even though the listener request specifies visibility=query, the events are not guaranteed to be delivered with visibility=query
            // If the event we are responding to arrives with visibility != query, we add a little delay to allow for the updated document to be available for queries
            // See https://www.sanity.io/docs/listening#visibility-c4786e55c3ff
            return timer(1200).pipe(mergeMap(doFetch))
          }
          if (event.type === 'reconnect') {
            return of(event)
          }
          return doFetch()
        }),
      )
    }),
    scan(
      (
        acc: null | {connected: boolean; documents: SanityDocumentLike[]},
        event: SearchQueryEvent,
      ) => ({
        connected: event.type !== 'reconnect',
        documents: event.type === 'result' ? event.documents : acc?.documents || [],
      }),
      null as null | {connected: boolean; documents: SanityDocumentLike[]},
    ),
    filter((v) => v !== null),
    swr(swrKey),
    map(({fromCache, value}): SearchQueryState => ({fromCache, ...value})),
  )
}
