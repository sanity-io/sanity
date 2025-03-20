import {isEqual} from 'lodash'
import {type ReactNode, useEffect, useMemo, useReducer, useRef, useState} from 'react'
import {SearchContext} from 'sanity/_singletons'

import {type CommandListHandle} from '../../../../../../components'
import {useSchema} from '../../../../../../hooks'
import {useActiveReleases} from '../../../../../../releases/store/useActiveReleases'
import {type SearchTerms} from '../../../../../../search'
import {useCurrentUser} from '../../../../../../store'
import {useSource} from '../../../../../source'
import {SEARCH_LIMIT} from '../../constants'
import {type RecentSearch} from '../../datastores/recentSearches'
import {createFieldDefinitionDictionary, createFieldDefinitions} from '../../definitions/fields'
import {createFilterDefinitionDictionary} from '../../definitions/filters'
import {createOperatorDefinitionDictionary} from '../../definitions/operators'
import {useSearch} from '../../hooks/useSearch'
import {type SearchOrdering} from '../../types'
import {validateFilter} from '../../utils/filterUtils'
import {hasSearchableTerms} from '../../utils/hasSearchableTerms'
import {isRecentSearchTerms} from '../../utils/isRecentSearchTerms'
import {initialSearchState, searchReducer} from './reducer'

interface SearchProviderProps {
  children?: ReactNode
  fullscreen?: boolean
  /**
   * list of perspective ids
   * if provided, then it means that the search is being done using a specific list of perspectives
   */

  /**
   * list of document ids that should be be disabled in the search
   * if they are found to exist in the search results
   * if provided, then ids should be checked against this list
   */
  disabledDocumentIds?: string[]
  /**
   * If true, the search action (such as adding a document to a release list, for example) should be allowed to disable under the right conditions
   */
  canDisableAction?: boolean
}

/**
 * @internal
 */
export function SearchProvider({
  children,
  fullscreen,
  disabledDocumentIds,
  canDisableAction,
}: SearchProviderProps) {
  const [onClose, setOnClose] = useState<(() => void) | null>(null)
  const [searchCommandList, setSearchCommandList] = useState<CommandListHandle | null>(null)
  const {data: releases} = useActiveReleases()
  const schema = useSchema()
  const currentUser = useCurrentUser()
  const {
    search: {operators, filters, strategy},
  } = useSource()

  // Create field, filter and operator dictionaries
  const {fieldDefinitions, filterDefinitions, operatorDefinitions} = useMemo(() => {
    return {
      fieldDefinitions: createFieldDefinitionDictionary(createFieldDefinitions(schema, filters)),
      filterDefinitions: createFilterDefinitionDictionary(filters),
      operatorDefinitions: createOperatorDefinitionDictionary(operators),
    }
  }, [filters, operators, schema])

  const initialState = useMemo(
    () =>
      initialSearchState({
        currentUser,
        fullscreen,
        definitions: {
          fields: fieldDefinitions,
          operators: operatorDefinitions,
          filters: filterDefinitions,
        },
        pagination: {
          cursor: null,
          nextCursor: null,
        },
        strategy,
      }),
    [currentUser, fullscreen, fieldDefinitions, operatorDefinitions, filterDefinitions, strategy],
  )
  const [state, dispatch] = useReducer(searchReducer, initialState)

  const {documentTypesNarrowed, filters: currentFilters, ordering, cursor, result, terms} = state

  const isMountedRef = useRef(false)
  const previousOrderingRef = useRef<SearchOrdering>(initialState.ordering)
  const previousCursorRef = useRef<string | null>(initialState.cursor)
  const previousTermsRef = useRef<SearchTerms | RecentSearch>(initialState.terms)

  const {handleSearch, searchState} = useSearch({
    initialState: {...result, terms},
    onComplete: (searchResult) => dispatch({...searchResult, type: 'SEARCH_REQUEST_COMPLETE'}),
    onError: (error) => dispatch({error, type: 'SEARCH_REQUEST_ERROR'}),
    onStart: () => dispatch({type: 'SEARCH_REQUEST_START'}),
    schema,
  })

  const hasValidTerms = hasSearchableTerms({terms})

  // Get a narrowed list of document types to search on based on any current active filters.
  const documentTypes = documentTypesNarrowed.map((documentType) => schema.get(documentType)!)

  // Get a list of 'complete' filters (filters that return valid values)
  const completeFilters = currentFilters.filter((filter) =>
    validateFilter({
      fieldDefinitions,
      filter,
      filterDefinitions,
      operatorDefinitions,
    }),
  )

  /**
   * Trigger search when any terms (query or selected types) OR current pageIndex has changed
   *
   * Note that we compare inbound terms with our last local snapshot, and not the value of
   * `searchState` from `useSearch`, as that only contains a reference to the last fully _executed_ request.
   * There are cases were we may not run searches when terms change (e.g. when search terms are empty / invalid).
   */
  useEffect(() => {
    const orderingChanged = !isEqual(ordering, previousOrderingRef.current)
    const cursorChanged = cursor !== previousCursorRef.current
    const termsChanged = !isEqual(terms, previousTermsRef.current)

    if (orderingChanged || cursorChanged || termsChanged) {
      let sortLabel = 'findability-sort:'

      if (ordering?.customMeasurementLabel || ordering.sort) {
        // Use a custom label if provided, otherwise return field and direction, e.g. `_updatedAt desc`
        sortLabel +=
          ordering?.customMeasurementLabel || `${ordering.sort?.field} ${ordering.sort?.direction}`
      }

      handleSearch({
        options: {
          // Comments prepended to each query for future measurement
          comments: [
            ...(isRecentSearchTerms(terms)
              ? [`findability-recent-search:${terms.__recent.index}`]
              : []),
            `findability-selected-types:${terms.types.length}`,
            sortLabel,
            `findability-source: global`,
            `findability-filter-count:${completeFilters.length}`,
          ],
          // `groq2024` supports pagination. Therefore, fetch fewer results.
          limit: strategy === 'groq2024' ? 25 : SEARCH_LIMIT,
          skipSortByScore: ordering.ignoreScore,
          ...(ordering.sort ? {sort: [ordering.sort]} : {}),
          cursor: cursor || undefined,
          perspective: 'raw',
        },
        terms: {
          ...terms,
          // Narrow document type search
          ...(documentTypes ? {types: documentTypes} : {}),
        },
      })

      // Update previousCursorRef snapshot only on a valid search request
      if (cursorChanged) {
        previousCursorRef.current = cursor
      }
    }

    // Update snapshots, even if no search request was executed
    previousOrderingRef.current = ordering
    previousTermsRef.current = terms
  }, [
    completeFilters.length,
    currentFilters,
    documentTypes,
    handleSearch,
    hasValidTerms,
    ordering,
    searchState.terms,
    terms,
    cursor,
    strategy,
    releases,
  ])

  /**
   * Reset search hits / state when (after initial amount):
   * - we have no valid search terms and
   * - we have existing hits
   */
  useEffect(() => {
    if (!hasValidTerms && isMountedRef?.current && result.hits.length > 0) {
      dispatch({type: 'SEARCH_CLEAR'})
    }

    isMountedRef.current = true
  }, [dispatch, hasValidTerms, result.hits, terms.query, terms.types])

  const value = useMemo(
    () => ({
      dispatch,
      onClose,
      searchCommandList,
      setSearchCommandList,
      setOnClose,
      state: {
        ...state,
        fullscreen,
        disabledDocumentIds,
        canDisableAction,
      },
    }),
    [fullscreen, disabledDocumentIds, canDisableAction, onClose, searchCommandList, state],
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}
