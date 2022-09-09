import type {SearchTerms, SearchableType, WeightedHit} from '@sanity/base'
import type {CurrentUser} from '@sanity/types'
import {RecentSearchTerms} from '../../datastores/recentSearches'
import {SearchOrdering, ORDER_RELEVANCE} from '../../types'
import {debugWithName, isDebugMode} from '../../utils/debug'
import {sortTypes} from './selectors'

export interface SearchReducerState {
  currentUser: CurrentUser
  debug: boolean
  filtersVisible: boolean
  ordering: SearchOrdering
  pageIndex: number
  recentSearches: RecentSearchTerms[]
  result: SearchResult
  terms: SearchTerms
}

export interface SearchResult {
  error: Error | null
  hasMore?: boolean
  hits: WeightedHit[]
  loaded: boolean
  loading: boolean
}

export function initialSearchState(
  currentUser: CurrentUser,
  recentSearches: RecentSearchTerms[]
): SearchReducerState {
  return {
    currentUser,
    debug: isDebugMode(),
    filtersVisible: false,
    ordering: ORDER_RELEVANCE,
    pageIndex: 0,
    recentSearches,
    result: {
      error: null,
      hasMore: null,
      hits: [],
      loaded: false,
      loading: false,
    },
    terms: {
      query: '',
      types: [],
    },
  }
}

export type FiltersHide = {type: 'FILTERS_HIDE'}
export type FiltersShow = {type: 'FILTERS_SHOW'}
export type FiltersToggle = {type: 'FILTERS_TOGGLE'}
export type PageIncrement = {type: 'PAGE_INCREMENT'}
export type RecentSearchesSet = {
  recentSearches: RecentSearchTerms[]
  type: 'RECENT_SEARCHES_SET'
}
export type SearchClear = {type: 'SEARCH_CLEAR'}
export type SearchOrderingReset = {type: 'SEARCH_ORDERING_RESET'}
export type SearchOrderingSet = {ordering: SearchOrdering; type: 'SEARCH_ORDERING_SET'}
export type SearchRequestComplete = {
  type: 'SEARCH_REQUEST_COMPLETE'
  hits: WeightedHit[]
}
export type SearchRequestError = {type: 'SEARCH_REQUEST_ERROR'; error: Error}
export type SearchRequestStart = {type: 'SEARCH_REQUEST_START'}
export type TermsQuerySet = {type: 'TERMS_QUERY_SET'; query: string}
export type TermsSet = {type: 'TERMS_SET'; terms: SearchTerms}
export type TermsTypeAdd = {type: 'TERMS_TYPE_ADD'; schemaType: SearchableType}
export type TermsTypeRemove = {type: 'TERMS_TYPE_REMOVE'; schemaType: SearchableType}
export type TermsTypesClear = {type: 'TERMS_TYPES_CLEAR'}

export type SearchAction =
  | FiltersHide
  | FiltersShow
  | FiltersToggle
  | PageIncrement
  | RecentSearchesSet
  | SearchClear
  | SearchRequestComplete
  | SearchRequestError
  | SearchRequestStart
  | SearchOrderingReset
  | SearchOrderingSet
  | TermsQuerySet
  | TermsSet
  | TermsTypeAdd
  | TermsTypeRemove
  | TermsTypesClear

const debug = debugWithName('searchReducer')

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
    case 'FILTERS_HIDE':
      return {
        ...state,
        filtersVisible: false,
      }
    case 'FILTERS_SHOW':
      return {
        ...state,
        filtersVisible: true,
      }
    case 'FILTERS_TOGGLE':
      return {
        ...state,
        filtersVisible: !state.filtersVisible,
      }
    case 'PAGE_INCREMENT':
      return {
        ...state,
        pageIndex: state.pageIndex + 1,
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
    case 'SEARCH_ORDERING_RESET':
      return {
        ...state,
        ordering: ORDER_RELEVANCE,
      }
    case 'SEARCH_ORDERING_SET':
      return {
        ...state,
        ordering: action.ordering,
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
    case 'TERMS_QUERY_SET':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: {
          ...state.terms,
          query: action.query,
        },
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
        terms: {
          ...state.terms,
          types: [...state.terms.types, action.schemaType].sort(sortTypes),
        },
      }
    case 'TERMS_TYPE_REMOVE':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: {
          ...state.terms,
          types: state.terms.types.filter((s) => s !== action.schemaType),
        },
      }
    case 'TERMS_TYPES_CLEAR':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: {
          ...state.terms,
          types: [],
        },
      }
    default:
      return state
  }
}
