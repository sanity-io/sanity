import {type Schema} from '@sanity/types'
import {useActorRef, useSelector} from '@xstate/react'
import {dequal} from 'dequal/lite'
import {useCallback, useEffect, useState} from 'react'
import {useEffectEvent} from 'use-effect-event'
import {fromObservable} from 'xstate'

import {isEqualSearchTerms} from '../../../../../search/common/isEqualSearchTerms'
import {
  type Groq2024SearchResults,
  type SearchHit,
  type WeightedSearchResults,
} from '../../../../../search/common/types'
import {defineSearchMachine} from '../../../../../search/searchMachine'
import {type SearchState} from '../types'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {
  isEqualSearchRequest,
  sanitizeSearchRequest,
  type SearchRequest,
} from '../utils/searchRequest'
import {useGlobalSearchFunction} from './useGlobalSearchFunction'

type SearchResults = WeightedSearchResults | Groq2024SearchResults

const DEFAULT_DEBOUNCE_TIME = 300 // ms

function isEqualSearchState(a: SearchState, b: SearchState): boolean {
  if (a === b) return true
  const {error: aError, terms: aTerms, ...aRest} = a
  const {error: bError, terms: bTerms, ...bRest} = b
  const errorsEqual =
    aError === bError ||
    (aError !== null &&
      bError !== null &&
      aError.name === bError.name &&
      aError.message === bError.message)
  return errorsEqual && isEqualSearchTerms(aTerms, bTerms) && dequal(aRest, bRest)
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
  const search = useGlobalSearchFunction(schema)

  const [machine] = useState(() => defineSearchMachine<SearchRequest, SearchResults>())
  const actorRef = useActorRef(
    machine.provide({
      actors: {
        search: fromObservable(({input}) => search(input.query.terms, input.query.options)),
      },
      guards: {
        'is same query': ({context, event}) => isEqualSearchRequest(context.query, event.query),
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
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- use-effect-event functions are stable, and react-hooks/exhaustive-deps forbids listing them
  }, [actorRef])

  // Captured once to mirror the useState mirror this replaces: the caller
  // rebuilds the object every render.
  const [initialSearchState] = useState(initialState)
  const searchState = useSelector(
    actorRef,
    (state): SearchState => {
      const {error, query, result, searchInterrupted, settledQuery} = state.context

      // Nothing has cleared the debounce yet, so callers still see the state
      // they seeded the hook with.
      if (
        query === null ||
        (state.matches('debouncing') && settledQuery === null && !searchInterrupted)
      ) {
        return initialSearchState
      }

      // While debouncing, the previous search's request is still the one the
      // current state describes.
      const activeQuery = state.matches('debouncing') ? (settledQuery ?? query) : query

      return {
        error,
        hits: state.matches({searching: 'pending'}) ? [] : (result?.hits ?? []),
        // A debounce that interrupted a running search keeps reporting
        // loading, like the interrupted request would have.
        loading: state.matches('searching') || (state.matches('debouncing') && searchInterrupted),
        options: activeQuery.options,
        terms: activeQuery.terms,
      }
    },
    isEqualSearchState,
  )

  const handleSearch = useCallback(
    (request: SearchRequest) =>
      actorRef.send({type: 'search', query: sanitizeSearchRequest(request)}),
    [actorRef],
  )

  return {handleSearch, searchState}
}
