import {SanityClient, SanityDocument} from '@sanity/client'
import {
  asyncScheduler,
  defer,
  merge,
  mergeMap,
  Observable,
  of,
  partition,
  share,
  take,
  throttleTime,
  throwError,
  timer,
} from 'rxjs'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {SortOrder} from './types'
import {
  createSearchQuery,
  Schema,
  SearchableType,
  SearchOptions,
  SearchTerms,
  WeightedSearchOptions,
} from 'sanity'

interface ListenQueryOptions {
  client: SanityClient
  filter: string
  limit: number
  params: Record<string, unknown>
  schema: Schema
  searchQuery: string
  sort: SortOrder
  staticTypeNames?: string[]
}

export function listenSearchQuery(options: ListenQueryOptions): Observable<SanityDocument[]> {
  const {client, schema, sort, limit, params, filter, searchQuery, staticTypeNames} = options
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
                : `Received unexpected type of first event "${ev.type}"`
            )
        )
      }
      return of(ev)
    }),
    share()
  )

  const [welcome$, mutationAndReconnect$] = partition(events$, (ev) => ev.type === 'welcome')

  return merge(
    welcome$.pipe(take(1)),
    mutationAndReconnect$.pipe(throttleTime(1000, asyncScheduler, {leading: true, trailing: true}))
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
          const types = typeNames.flatMap((name) => schema.get(name) || []) as SearchableType[]

          const searchTerms: SearchTerms = {
            filter,
            query: searchQuery || '',
            types,
          }

          const searchOptions: SearchOptions & WeightedSearchOptions = {
            __unstable_extendedProjection: extendedProjection,
            comments: [`findability-source: ${searchQuery ? 'list-query' : 'list'}`],
            limit,
            params,
            sort: sortBy,
          }

          const {query: createdQuery, params: createdParams} = createSearchQuery(
            searchTerms,
            searchOptions
          )
          const doFetch = () => client.observable.fetch(createdQuery, createdParams)

          if (event.type === 'mutation' && event.visibility !== 'query') {
            // Even though the listener request specifies visibility=query, the events are not guaranteed to be delivered with visibility=query
            // If the event we are responding to arrives with visibility != query, we add a little delay to allow for the updated document to be available for queries
            // See https://www.sanity.io/docs/listening#visibility-c4786e55c3ff
            return timer(1200).pipe(mergeMap(doFetch))
          }
          return doFetch()
        })
      )
    })
  )
}
