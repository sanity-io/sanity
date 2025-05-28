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
import {scan} from 'rxjs/operators'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {
  createSearch,
  createSWR,
  getSearchableTypes,
  type SanityDocumentLike,
  type Schema,
  type SearchOptions,
  type SearchStrategy,
} from 'sanity'

import {getExtendedProjection} from '../../structureBuilder/util/getExtendedProjection'
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
    maxFieldDepth,
    searchStrategy,
  } = options
  const sortBy = sort.by
  const extendedProjection = sort?.extendedProjection

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
    sort,
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
              // make a call to getExtendedProjection in strict mode to verify that all fields are
              // known. This method will throw an exception if there are any unknown fields specified
              // in the sort by list
              getExtendedProjection(type, sort.by, true)
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

            const searchOptions: SearchOptions = {
              __unstable_extendedProjection: extendedProjection,
              comments: [`findability-source: ${searchQuery ? 'list-query' : 'list'}`],
              limit,
              skipSortByScore: true,
              sort: sortBy,
              perspective,
            }

            return search(searchTerms, searchOptions).pipe(
              map((result) =>
                // eslint-disable-next-line max-nested-callbacks
                result.hits.map(({hit}) => hit),
              ),
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
