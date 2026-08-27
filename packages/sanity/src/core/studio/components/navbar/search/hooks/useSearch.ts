import {type Schema} from '@sanity/types'
import {useActorRef, useSelector} from '@xstate/react'
import isEqual from 'lodash-es/isEqual.js'
import {
  useCallback,
  useEffect,
  // oxlint-disable-next-line no-restricted-imports -- useSearch is only called from plain function components (SearchProvider and the search filter ReferenceAutocomplete), so facebook/react#34818 does not apply
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import {fromObservable} from 'xstate'

import {useClient} from '../../../../../hooks/useClient'
import {
  type Groq2024SearchResults,
  type SearchHit,
  type SearchOptions,
  type SearchTerms,
  type WeightedSearchResults,
} from '../../../../../search/common/types'
import {createSearch} from '../../../../../search/search'
import {defineSearchMachine} from '../../../../../search/searchMachine'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {useWorkspace} from '../../../../workspace'
import {type SearchState} from '../types'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {getSearchableOmnisearchTypes} from '../utils/selectors'
import {useSearchMaxFieldDepth} from './useSearchMaxFieldDepth'

interface SearchRequest {
  debounceTime?: number
  options?: SearchOptions
  terms: SearchTerms
}

type SearchResults = WeightedSearchResults | Groq2024SearchResults

const DEFAULT_DEBOUNCE_TIME = 300 // ms

function sanitizeRequest(request: SearchRequest) {
  return {
    ...request,
    terms: {
      ...request.terms,
      filter: request.terms.filter?.trim(),
      query: request.terms.query.trim(),
    },
  }
}

export function useSearch({
  allowEmptyQueries,
  initialState,
  onComplete,
  onError,
  onStart,
  schema,
}: {
  allowEmptyQueries?: boolean
  initialState: SearchState
  onComplete?: (result: {hits: SearchHit[]; nextCursor: string | undefined}) => void
  onError?: (error: Error) => void
  onStart?: () => void
  schema: Schema
}): {
  handleSearch: (request: SearchRequest) => void
  searchState: SearchState
} {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const maxFieldDepth = useSearchMaxFieldDepth()
  const {strategy} = useWorkspace().search

  const search = useMemo(
    () =>
      createSearch(getSearchableOmnisearchTypes(schema), client, {
        tag: 'search.global',
        unique: true,
        strategy,
        maxDepth: maxFieldDepth,
      }),
    [schema, client, strategy, maxFieldDepth],
  )

  const [machine] = useState(() => defineSearchMachine<SearchRequest, SearchResults>())
  const actorRef = useActorRef(
    machine.provide({
      actors: {
        search: fromObservable(({input}) => search(input.query.terms, input.query.options)),
      },
      guards: {
        'is same query': ({context, event}) => isEqual(context.query, event.query),
        'should search': ({context}) =>
          context.query !== null &&
          hasSearchableTerms({allowEmptyQueries, terms: context.query.terms}),
      },
      delays: {
        debounce: ({context}) => context.query?.debounceTime || DEFAULT_DEBOUNCE_TIME,
      },
    }),
    {input: {}},
  )

  const handleSearchStarted = useEffectEvent(() => onStart?.())
  const handleSearchCompleted = useEffectEvent((result: SearchResults) =>
    onComplete?.({hits: result.hits, nextCursor: result.nextCursor}),
  )
  const handleSearchSkipped = useEffectEvent(() => onComplete?.({hits: [], nextCursor: undefined}))
  const handleSearchFailed = useEffectEvent((error: Error) => onError?.(error))

  useEffect(() => {
    const subscriptions = [
      actorRef.on('search started', () => handleSearchStarted()),
      actorRef.on('search completed', (event) => handleSearchCompleted(event.result)),
      actorRef.on('search skipped', () => handleSearchSkipped()),
      actorRef.on('search failed', (event) => handleSearchFailed(event.error)),
    ]
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe())
  }, [actorRef])

  // Captured once to mirror the useState mirror this replaces: both callers
  // rebuild the object every render.
  const [initialSearchState] = useState(initialState)
  const searchState = useSelector(
    actorRef,
    (state): SearchState => {
      const {error, query, result, settledQuery} = state.context

      // Nothing has cleared the debounce yet, so callers still see the state
      // they seeded the hook with.
      if (query === null || (state.matches('debouncing') && settledQuery === null)) {
        return initialSearchState
      }

      // While debouncing, the previous search's request is still the one the
      // current state describes.
      const activeQuery = state.matches('debouncing') ? (settledQuery ?? query) : query

      return {
        error,
        hits: state.matches('searching') ? [] : (result?.hits ?? []),
        loading: state.matches('searching'),
        options: activeQuery.options,
        terms: activeQuery.terms,
      }
    },
    isEqual,
  )

  const handleSearch = useCallback(
    (request: SearchRequest) => actorRef.send({type: 'search', query: sanitizeRequest(request)}),
    [actorRef],
  )

  return {handleSearch, searchState}
}
