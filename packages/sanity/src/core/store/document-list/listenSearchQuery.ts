import {type SanityClient} from '@sanity/client'
import {map, mergeMap, type Observable, of} from 'rxjs'
import {filter} from 'rxjs/operators'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {
  createSearch,
  createSWR,
  getSearchableTypes,
  type SanityDocumentLike,
  type Schema,
  type SortOrdering,
} from 'sanity'

import {shareReplayLatest} from '../../preview/utils/shareReplayLatest'
import {type WeightedSearchResults} from '../../search'
import {memoize} from '../_legacy/document/utils/createMemoizer'
import {getExtendedProjection} from './getExtendedProjection'
import {
  type LiveClientConfig,
  liveClientConfigFromClient,
  observeLiveEvents,
} from './observeLiveEvents'

interface ListenQueryOptions {
  client: SanityClient
  filter: string
  limit: number
  params: Record<string, unknown>
  schema: Schema
  searchQuery: string
  sort: SortOrdering
  staticTypeNames?: string[] | null
  maxFieldDepth?: number
  enableLegacySearch?: boolean
}

export interface SearchQueryResult {
  fromCache: boolean
  documents: SanityDocumentLike[]
}

const swr = createSWR<SanityDocumentLike[]>({maxSize: 100})

const getLiveEvents = memoize(
  (config: LiveClientConfig) =>
    observeLiveEvents(config).pipe(shareReplayLatest((e) => e.type === 'welcome')),
  (config) => config.projectId + config.dataset + config.apiVersion,
)

export function listenSearchQuery(options: ListenQueryOptions): Observable<SearchQueryResult> {
  const {
    client: _client,
    schema,
    sort,
    limit,
    params,
    filter: groqFilter,
    searchQuery,
    staticTypeNames,
    maxFieldDepth,
    enableLegacySearch,
  } = options
  const sortBy = sort.by
  const extendedProjection = sort?.extendedProjection

  const client = _client.withConfig({apiVersion: 'X'})
  const swrKey = JSON.stringify({groqFilter, limit, params, searchQuery, sort, staticTypeNames})

  let currentSyncTags: string[] = []
  const invalidations$ = getLiveEvents(liveClientConfigFromClient(client))
  return invalidations$.pipe(
    filter(
      (event) =>
        event.type === 'welcome' ||
        event.type === 'restart' ||
        (event.type === 'message' && event.tags.some((tag) => currentSyncTags.includes(tag))),
    ),
    exhaustMapWithTrailing((event) => {
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
            tag: 'document-list-search',
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
              skipSortByScore: true,
              sort: sortBy,
            }

            return search(searchTerms, searchOptions).pipe(
              // @ts-expect-error - todo: fixme
              map((result: WeightedSearchResults) => {
                currentSyncTags = result.syncTags
                // eslint-disable-next-line max-nested-callbacks
                return result.hits.map(({hit}) => hit)
              }),
            )
          }
          return doFetch()
        }),
      )
    }),
    swr(swrKey),
    map(({fromCache, value}) => ({fromCache, documents: value})),
  )
}
