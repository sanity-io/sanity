import {SanityClient, SanityDocument} from '@sanity/client'
import {Observable, debounce, mergeMap, of, share, throwError, timer} from 'rxjs'
import {SortOrder} from './types'
import {
  SearchableType,
  SearchTerms,
  SearchOptions,
  WeightedSearchOptions,
  createSearchQuery,
  Schema,
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

/** @internal */
export function listenSearchQuery(options: ListenQueryOptions): Observable<SanityDocument[]> {
  const {client, schema, sort, limit, params, filter, searchQuery, staticTypeNames} = options
  const sortBy = sort.by
  const extendedProjection = sort?.extendedProjection

  return client.listen(`*[${filter}]`, params, {events: ['welcome', 'mutation']}).pipe(
    // If the first event is not welcome, it is most likely a reconnect and
    // if it's not a reconnect something is very wrong
    mergeMap((event, i) => {
      const isFirstEvent = i === 0
      const isWelcomeEvent = event.type === 'welcome'

      if (isFirstEvent && !isWelcomeEvent) {
        return throwError(
          () =>
            new Error(
              event.type === 'reconnect'
                ? 'Could not establish EventSource connection'
                : `Received unexpected type of first event "${event.type}"`
            )
        )
      }
      return of(event)
    }),
    share(),
    // Skip debounce on welcome events to avoid delaying the initial fetch
    debounce((event) => (event.type === 'welcome' ? of('') : timer(1000))),
    // Get type names to use for searching.
    // If we have a static list of types, we can skip fetching the types
    mergeMap((): Observable<string[]> => {
      if (staticTypeNames) {
        return of(staticTypeNames)
      }

      return client.observable.fetch(`array::unique(*[${filter}][]._type)`, params)
    }),
    // Use the type names to create a search query and fetch documents
    mergeMap((typeNames) => {
      const types = typeNames.flatMap((typeName) => schema.get(typeName) || []) as SearchableType[]

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

      return client.observable.fetch(createdQuery, createdParams)
    })
  )
}
