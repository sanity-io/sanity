import isEqual from 'lodash/isEqual'
import React, {ReactNode, useEffect, useMemo, useReducer, useRef} from 'react'
import {useClient, useSchema} from '../../../../../../hooks'
import {useCurrentUser} from '../../../../../../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../../studioClient'
import {getSchemaFields} from '../../components/getSchemaFields'
import {FINDABILITY_MVI, SEARCH_LIMIT} from '../../constants'
import {createRecentSearchesStore, RecentOmnisearchTerms} from '../../datastores/recentSearches'
import {useSearch} from '../../hooks/useSearch'
import type {
  KeyedSearchFilter,
  OmnisearchTerms,
  SearchFilter,
  SearchFilterGroup,
  SearchOrdering,
} from '../../types'
import {generateKey} from '../../utils/generateKey'
import {hasSearchableTerms} from '../../utils/hasSearchableTerms'
import {isRecentSearchTerms} from '../../utils/isRecentSearchTerms'
import {initialSearchState, searchReducer} from './reducer'
import {SearchContext} from './SearchContext'

interface SearchProviderProps {
  children?: ReactNode
}

/**
 * @internal
 */
export function SearchProvider({children}: SearchProviderProps) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()
  const currentUser = useCurrentUser()

  const {dataset, projectId} = client.config()

  const filterGroups: SearchFilterGroup[] = useMemo(() => {
    const flattenedFields = getSchemaFields(schema)

    // TODO: wrap in `defineFilter` or equivalent
    const commonFilters: KeyedSearchFilter[] = [
      {
        _key: generateKey(),
        fieldPath: '_updatedAt',
        fieldType: 'datetime',
        path: ['Updated at'],
        type: 'field',
      },
      {
        _key: generateKey(),
        fieldPath: '_createdAt',
        fieldType: 'datetime',
        path: ['Created at'],
        type: 'field',
      },
      {
        _key: generateKey(),
        id: 'isPublished',
        type: 'compound',
      },
      {
        _key: generateKey(),
        id: 'hasDraft',
        type: 'compound',
      },
      {
        _key: generateKey(),
        id: 'hasReference',
        type: 'compound',
      },
      {
        _key: generateKey(),
        fieldPath: '_id',
        fieldType: 'string',
        path: ['ID'],
        type: 'field',
      },
    ]

    const schemaFieldFilters: KeyedSearchFilter[] = flattenedFields.map(
      (field) =>
        ({
          _key: generateKey(),
          documentTypes: field.documentTypes,
          fieldPath: field.fieldPath,
          fieldType: field.type,
          path: field.path,
          type: 'field',
        } as KeyedSearchFilter)
    )

    return [
      {
        items: commonFilters,
        type: 'common',
      } as SearchFilterGroup,
      {
        items: schemaFieldFilters,
        type: 'fields',
      } as SearchFilterGroup,
    ]
  }, [schema])

  // Create local storage store
  const recentSearchesStore = useMemo(
    () => createRecentSearchesStore({dataset, projectId, schema, user: currentUser}),
    [currentUser, dataset, projectId, schema]
  )

  const recentSearches = useMemo(
    () => recentSearchesStore?.getRecentSearchTerms(),
    [recentSearchesStore]
  )

  const initialState = useMemo(
    () => initialSearchState(currentUser, recentSearches),
    [currentUser, recentSearches]
  )
  const [state, dispatch] = useReducer(searchReducer, initialState)

  const {ordering, pageIndex, result, terms} = state

  const isMountedRef = useRef(false)
  const previousOrderingRef = useRef<SearchOrdering>(initialState.ordering)
  const previousPageIndexRef = useRef<number>(initialState.pageIndex)
  const previousTermsRef = useRef<OmnisearchTerms | RecentOmnisearchTerms>(initialState.terms)

  const {handleSearch, searchState} = useSearch({
    initialState: {...result, terms},
    onComplete: (hits) => dispatch({hits, type: 'SEARCH_REQUEST_COMPLETE'}),
    onError: (error) => dispatch({error, type: 'SEARCH_REQUEST_ERROR'}),
    onStart: () => dispatch({type: 'SEARCH_REQUEST_START'}),
    schema,
  })

  const hasValidTerms = hasSearchableTerms(terms)

  /**
   * Trigger search when any terms (query or selected types) OR current pageIndex has changed
   *
   * Note that we compare inbound terms with our last local snapshot, and not the value of
   * `searchState` from `useSearch`, as that only contains a reference to the last fully _executed_ request.
   * There are cases were we may not run searches when terms change (e.g. when search terms are empty / invalid).
   */
  useEffect(() => {
    const orderingChanged = !isEqual(ordering, previousOrderingRef.current)
    const pageIndexChanged = pageIndex !== previousPageIndexRef.current
    const termsChanged = !isEqual(terms, previousTermsRef.current)

    if (orderingChanged || pageIndexChanged || termsChanged) {
      // Use a custom label if provided, otherwise return field and direction, e.g. `_updatedAt desc`
      const sortLabel =
        ordering?.customMeasurementLabel || `${ordering.sort.field} ${ordering.sort.direction}`

      // TODO: re-enable
      /*
      handleSearch({
        options: {
          // Comments prepended to each query for future measurement
          comments: [
            `findability-mvi:${FINDABILITY_MVI}`,
            ...(isRecentSearchTerms(terms)
              ? [`findability-recent-search:${terms.__recent.index}`]
              : []),
            `findability-selected-types:${terms.types.length}`,
            `findability-sort:${sortLabel}`,
          ],
          limit: SEARCH_LIMIT,
          offset: pageIndex * SEARCH_LIMIT,
          skipSortByScore: ordering.ignoreScore,
          sort: ordering.sort,
        },
        terms,
      })
      */

      // Update pageIndex snapshot only on a valid search request
      previousPageIndexRef.current = pageIndex
    }

    // Update snapshots, even if no search request was executed
    previousOrderingRef.current = ordering
    previousTermsRef.current = terms
  }, [handleSearch, hasValidTerms, ordering, pageIndex, searchState.terms, terms])

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

  return (
    <SearchContext.Provider
      value={{
        dispatch,
        filterGroups,
        recentSearchesStore,
        state,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
