import {type SanityClient} from '@sanity/client'
import QuickLRU from 'quick-lru'
import {
  asyncScheduler,
  defer,
  EMPTY,
  map,
  merge,
  mergeMap,
  type Observable,
  of,
  type OperatorFunction,
  partition,
  pipe,
  share,
  take,
  throttleTime,
  throwError,
  timer,
} from 'rxjs'
import {tap} from 'rxjs/operators'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {createSearch, getSearchableTypes, type SanityDocumentLike, type Schema} from 'sanity'

import {getExtendedProjection} from '../../structureBuilder/util/getExtendedProjection'
import {ENABLE_LRU_MEMO} from './constants'
import {type SortOrder} from './types'

interface ListenQueryOptions {
  client: SanityClient
  filter: string
  limit: number
  params: Record<string, unknown>
  schema: Schema
  searchQuery: string
  sort: SortOrder
  perspective?: string
  staticTypeNames?: string[] | null
  maxFieldDepth?: number
  enableLegacySearch?: boolean
}

export interface SearchQueryResult {
  fromCache: boolean
  documents: SanityDocumentLike[]
}

export function listenSearchQuery(options: ListenQueryOptions): Observable<SearchQueryResult> {
  const {
    client,
    schema,
    sort,
    perspective,
    limit,
    params,
    filter,
    searchQuery,
    staticTypeNames,
    maxFieldDepth,
    enableLegacySearch,
  } = options
  const sortBy = sort.by
  const extendedProjection = sort?.extendedProjection

  // Listen for changes with the given filter and params, and whenever a change occurs, we want to
  // re-fetch the documents that match the search query (see below).
  // We use a separate listener since the search query is too large to use in a listen query.
  const events$ = defer(() => {
    return client.listen(`*[${filter}]`, params, {
      events: ['welcome', 'mutation', 'reconnect'],
      includeResult: false,
      visibility: 'query',
    })
  }).pipe(
    mergeMap((ev, i) => {
      const isFirst = i === 0
      if (isFirst && ev.type !== 'welcome') {
        // If the first event is not welcome, it is most likely a reconnect and
        // if it's not a reconnect something is very wrong and we should throw.
        return throwError(
          () =>
            new Error(
              ev.type === 'reconnect'
                ? 'Could not establish EventSource connection'
                : `Received unexpected type of first event "${ev.type}"`,
            ),
        )
      }
      return of(ev)
    }),
    share(),
  )

  const [welcome$, mutationAndReconnect$] = partition(events$, (ev) => ev.type === 'welcome')

  const memoKey = JSON.stringify({filter, limit, params, searchQuery, sort, staticTypeNames})

  return merge(
    welcome$.pipe(take(1)),
    mutationAndReconnect$.pipe(throttleTime(1000, asyncScheduler, {leading: true, trailing: true})),
  ).pipe(
    exhaustMapWithTrailing((event) => {
      // Get the types names to use for searching.
      // If we have a static list of types, we can skip fetching the types and use the static list.
      const typeNames$ = staticTypeNames
        ? of(staticTypeNames)
        : client.observable.fetch(`array::unique(*[${filter}][]._type)`, params)

      // Use the type names to create a search query and fetch the documents that match the query.
      return typeNames$.pipe(
        mergeMap((typeNames: string[]) => {
          const types = getSearchableTypes(schema, staticTypeNames || []).filter((type) => {
            if (typeNames.includes(type.name)) {
              // make a call to getExtendedProjection in strict mode to verify that all fields are
              // known. This method will throw an exception if there are any unknown fields specified
              // in the sort by list
              getExtendedProjection(type, sort.by, true)
              return true
            }
            return false
          })

          const search = createSearch(types, client, {
            filter,
            params,
            enableLegacySearch,
            maxDepth: maxFieldDepth,
          })

          const doFetch = () => {
            const searchTerms = {
              query: searchQuery || '',
              types,
            }

            const searchOptions = {
              __unstable_extendedProjection: extendedProjection,
              comments: [`findability-source: ${searchQuery ? 'list-query' : 'list'}`],
              limit,
              perspective: omitBundlePerspective(perspective),
              skipSortByScore: true,
              sort: sortBy,
            }

            return search(searchTerms, searchOptions).pipe(
              map((result) =>
                // eslint-disable-next-line max-nested-callbacks
                result.hits.map(({hit}) => hit),
              ),
            )
          }

          if (event.type === 'mutation' && event.visibility !== 'query') {
            // Even though the listener request specifies visibility=query, the events are not guaranteed to be delivered with visibility=query
            // If the event we are responding to arrives with visibility != query, we add a little delay to allow for the updated document to be available for queries
            // See https://www.sanity.io/docs/listening#visibility-c4786e55c3ff
            return timer(1200).pipe(mergeMap(doFetch))
          }
          return doFetch()
        }),
      )
    }),
    ENABLE_LRU_MEMO
      ? pipe(
          memoLRU(memoKey, lru),
          map((memo) => ({
            fromCache: memo.type === 'memo',
            documents: memo.value,
          })),
        )
      : map((documents) => ({
          fromCache: false,
          documents,
        })),
  )
}

const lru = new QuickLRU<string, SanityDocumentLike[]>({maxSize: 100})
function memoLRU<T>(
  memoKey: string,
  cache: QuickLRU<string, T>,
): OperatorFunction<T, {type: 'memo'; value: T} | {type: 'value'; value: T}> {
  return (input$: Observable<T>) =>
    merge(
      defer(() =>
        cache.has(memoKey) ? of({type: 'memo' as const, value: cache.get(memoKey)!}) : EMPTY,
      ),
      input$.pipe(
        tap((result) => cache.set(memoKey, result)),
        map((value) => ({
          type: 'value' as const,
          value: value,
        })),
      ),
    )
}

function omitBundlePerspective(perspective: string | undefined): string | undefined {
  if (perspective?.startsWith('bundle.')) {
    return undefined
  }

  return perspective
}
