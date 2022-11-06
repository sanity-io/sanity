/* eslint-disable complexity */
// TODO: re-enable the above
import type {CurrentUser} from '@sanity/types'
import type {SearchableType, WeightedHit} from '../../../../../../search'
import {ORDERINGS} from '../../definitions/orderings'
import type {RecentOmnisearchTerms} from '../../datastores/recentSearches'
import {getFilterDefinitionInitialOperator} from '../../definitions/filters'
import type {ValidatedSearchFilter, OmnisearchTerms, SearchOrdering} from '../../types'
import {debugWithName, isDebugMode} from '../../utils/debug'
import {generateKey} from '../../utils/generateKey'
import {isRecentSearchTerms} from '../../utils/isRecentSearchTerms'
import {sortTypes} from '../../utils/selectors'
import {getOperator, getOperatorInitialValue, OperatorType} from '../../definitions/operators'

export interface SearchReducerState {
  currentUser: CurrentUser | null
  debug: boolean
  filtersVisible: boolean
  lastAddedFilter?: ValidatedSearchFilter
  ordering: SearchOrdering
  pageIndex: number
  recentSearches: RecentOmnisearchTerms[]
  result: SearchResult
  terms: RecentOmnisearchTerms | OmnisearchTerms
}

export interface SearchResult {
  error: Error | null
  hasMore?: boolean | null
  hits: WeightedHit[]
  loaded: boolean
  loading: boolean
}

export function initialSearchState(
  currentUser: CurrentUser | null,
  recentSearches?: RecentOmnisearchTerms[]
): SearchReducerState {
  return {
    currentUser,
    debug: isDebugMode(),
    filtersVisible: true,
    ordering: ORDERINGS.relevance,
    pageIndex: 0,
    recentSearches: recentSearches || [],
    result: {
      error: null,
      hasMore: null,
      hits: [],
      loaded: false,
      loading: false,
    },
    terms: {
      filters: [],
      query: '',
      types: [],
    },
  }
}

export type FiltersVisibleSet = {type: 'FILTERS_VISIBLE_SET'; visible: boolean}
export type PageIncrement = {type: 'PAGE_INCREMENT'}
export type RecentSearchesSet = {
  recentSearches: RecentOmnisearchTerms[]
  type: 'RECENT_SEARCHES_SET'
}
export type OrderingReset = {type: 'ORDERING_RESET'}
export type OrderingSet = {ordering: SearchOrdering; type: 'ORDERING_SET'}
export type SearchClear = {type: 'SEARCH_CLEAR'}
export type SearchRequestComplete = {
  type: 'SEARCH_REQUEST_COMPLETE'
  hits: WeightedHit[]
}
export type SearchRequestError = {type: 'SEARCH_REQUEST_ERROR'; error: Error}
export type SearchRequestStart = {type: 'SEARCH_REQUEST_START'}
export type TermsFiltersAdd = {filter: ValidatedSearchFilter; type: 'TERMS_FILTERS_ADD'}
export type TermsFiltersClear = {type: 'TERMS_FILTERS_CLEAR'}
export type TermsFiltersRemove = {_key: string; type: 'TERMS_FILTERS_REMOVE'}
export type TermsFiltersSetOperator = {
  key: string
  operatorType: OperatorType
  type: 'TERMS_FILTERS_SET_OPERATOR'
}
export type TermsFiltersSetValue = {
  key: string
  type: 'TERMS_FILTERS_SET_VALUE'
  value?: any
}
export type TermsQuerySet = {type: 'TERMS_QUERY_SET'; query: string}
export type TermsSet = {type: 'TERMS_SET'; terms: OmnisearchTerms}
export type TermsTypeAdd = {type: 'TERMS_TYPE_ADD'; schemaType: SearchableType}
export type TermsTypeRemove = {type: 'TERMS_TYPE_REMOVE'; schemaType: SearchableType}
export type TermsTypesClear = {type: 'TERMS_TYPES_CLEAR'}

export type SearchAction =
  | FiltersVisibleSet
  | OrderingReset
  | OrderingSet
  | PageIncrement
  | RecentSearchesSet
  | SearchClear
  | SearchRequestComplete
  | SearchRequestError
  | SearchRequestStart
  | TermsFiltersAdd
  | TermsFiltersClear
  | TermsFiltersSetOperator
  | TermsFiltersRemove
  | TermsFiltersSetValue
  | TermsQuerySet
  | TermsSet
  | TermsTypeAdd
  | TermsTypeRemove
  | TermsTypesClear

const debug = debugWithName('reducer')

// TODO: split into multiple reducers and combine. Also consider immer
export function searchReducer(state: SearchReducerState, action: SearchAction): SearchReducerState {
  let prefix = '🔍'
  if (action.type.startsWith('SEARCH_REQUEST')) {
    prefix = '🚨'
  }
  if (action.type.startsWith('RECENT_SEARCHES')) {
    prefix = '💾'
  }
  debug(prefix, action)

  switch (action.type) {
    case 'FILTERS_VISIBLE_SET':
      return {
        ...state,
        filtersVisible: action.visible,
      }
    case 'ORDERING_RESET':
      return {
        ...state,
        ordering: ORDERINGS.relevance,
        terms: stripRecent(state.terms),
      }
    case 'ORDERING_SET':
      return {
        ...state,
        ordering: action.ordering,
        terms: stripRecent(state.terms),
      }
    case 'PAGE_INCREMENT':
      return {
        ...state,
        pageIndex: state.pageIndex + 1,
        terms: stripRecent(state.terms),
      }
    case 'RECENT_SEARCHES_SET':
      return {
        ...state,
        recentSearches: action.recentSearches,
      }
    case 'SEARCH_CLEAR':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          hasMore: null,
          hits: [],
        },
      }
    case 'SEARCH_REQUEST_COMPLETE':
      return {
        ...state,
        result: {
          ...state.result,
          error: null,
          hasMore: action.hits.length > 0,
          hits: state.pageIndex > 0 ? [...state.result.hits, ...action.hits] : action.hits,
          loaded: true,
          loading: false,
        },
      }
    case 'SEARCH_REQUEST_ERROR':
      return {
        ...state,
        result: {
          ...state.result,
          error: action.error,
          loaded: false,
          loading: false,
        },
      }
    case 'SEARCH_REQUEST_START':
      return {
        ...state,
        result: {
          ...state.result,
          loaded: false,
          loading: true,
        },
      }
    case 'TERMS_FILTERS_ADD': {
      const operatorType = getFilterDefinitionInitialOperator(action.filter.filterType)

      const newFilter: ValidatedSearchFilter = {
        ...action.filter,
        _key: generateKey(),
        // Set initial value + operator
        operatorType,
        value: operatorType && getOperatorInitialValue(operatorType),
      }

      return {
        ...state,
        lastAddedFilter: newFilter,
        terms: {
          ...state.terms,
          filters: [
            ...state.terms.filters, //
            newFilter,
          ],
        },
      }
    }
    case 'TERMS_FILTERS_CLEAR':
      return {
        ...state,
        terms: {
          ...state.terms,
          filters: [],
        },
      }
    case 'TERMS_FILTERS_REMOVE': {
      const index = state.terms.filters.findIndex((filter) => filter._key === action._key)
      return {
        ...state,
        terms: {
          ...state.terms,
          filters: [
            ...state.terms.filters.slice(0, index), //
            ...state.terms.filters.slice(index + 1),
          ],
        },
      }
    }
    case 'TERMS_FILTERS_SET_OPERATOR': {
      // Compare input components between current and target operators, and update
      // target filter value if it has changed.
      const matchedFilter = state.terms.filters.find((filter) => filter._key === action.key)
      const currentOperator = getOperator(matchedFilter?.operatorType)
      const nextOperator = getOperator(action.operatorType)
      const nextInitialValue = getOperatorInitialValue(action.operatorType)
      const inputComponentChanged = currentOperator?.inputComponent != nextOperator?.inputComponent

      return {
        ...state,
        terms: {
          ...state.terms,
          filters: state.terms.filters.map((filter) => {
            if (filter._key === action.key) {
              return {
                ...filter,
                operatorType: action.operatorType,
                ...(inputComponentChanged ? {value: nextInitialValue} : {}),
              }
            }
            return filter
          }),
        },
      }
    }
    case 'TERMS_FILTERS_SET_VALUE': {
      return {
        ...state,
        terms: {
          ...state.terms,
          filters: state.terms.filters.map((filter) => {
            if (filter._key === action.key) {
              return {
                ...filter,
                value: action.value,
              }
            }
            return filter
          }),
        },
      }
    }
    case 'TERMS_QUERY_SET':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: stripRecent({
          ...state.terms,
          query: action.query,
        }),
      }
    case 'TERMS_SET':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: action.terms,
      }
    case 'TERMS_TYPE_ADD':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: stripRecent({
          ...state.terms,
          filters: [], // Clear all filters
          types: [
            ...(state.terms.types || []), //
            action.schemaType,
          ].sort(sortTypes),
        }),
      }
    case 'TERMS_TYPE_REMOVE':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: stripRecent({
          ...state.terms,
          types: (state.terms.types || []).filter((s) => s !== action.schemaType),
        }),
      }
    case 'TERMS_TYPES_CLEAR':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: stripRecent({
          ...state.terms,
          types: [],
        }),
      }
    default:
      return state
  }
}

/**
 * This function is used to strip __recent from terms, generally whenever there's a change in
 * search terms or options that would otherwise trigger an additional search request.
 * (e.g. updating the search query, changing a sort filter, adding / removing document types)
 *
 * This is done so we can better disambiguate between requests sent as a result of clicking a 'recent search'
 * for purposes of measurement.
 *
 * TODO: remove this (and associated tests) once client-side instrumentation is available
 */
function stripRecent(terms: RecentOmnisearchTerms | OmnisearchTerms) {
  if (isRecentSearchTerms(terms)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {__recent, ...rest} = terms
    return rest
  }
  return terms
}
