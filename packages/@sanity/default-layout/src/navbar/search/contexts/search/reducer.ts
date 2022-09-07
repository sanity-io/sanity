// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {SearchTerms, SearchableType, WeightedHit} from '@sanity/base'
import type {CurrentUser} from '@sanity/types'
import schema from 'part:@sanity/base/schema'
import {RecentSearchTerms} from '../../datastores/recentSearches'
import type {SearchSort} from '../../types'
import {debugWithName} from '../../utils/debug'
import {getSortedSearchableTypes, sortTypes} from './selectors'

export interface SearchReducerState {
  currentUser: CurrentUser
  filtersVisible: boolean
  pageIndex: number
  recentSearches: RecentSearchTerms[]
  result: SearchResult
  searchableTypes: SearchableType[]
  sort: SearchSort
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
    filtersVisible: false,
    pageIndex: 0,
    recentSearches,
    result: {
      error: null,
      hasMore: null,
      hits: [],
      loaded: false,
      loading: false,
    },
    searchableTypes: getSortedSearchableTypes(schema),
    sort: {
      mode: 'relevance',
      order: 'desc',
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
export type SearchRequestComplete = {
  type: 'SEARCH_REQUEST_COMPLETE'
  hits: WeightedHit[]
}
export type SearchableTypesReset = {type: 'SEARCHABLE_TYPES_RESET'}
export type SearchableTypesSet = {searchableTypes?: SearchableType[]; type: 'SEARCHABLE_TYPES_SET'}
export type SearchRequestError = {type: 'SEARCH_REQUEST_ERROR'; error: Error}
export type SearchRequestStart = {type: 'SEARCH_REQUEST_START'}
export type SortReset = {type: 'SORT_RESET'}
export type SortSet = {type: 'SORT_SET'; sort: SearchSort}
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
  | SearchableTypesReset
  | SearchableTypesSet
  | SearchClear
  | SearchRequestComplete
  | SearchRequestError
  | SearchRequestStart
  | SortReset
  | SortSet
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
    case 'SEARCHABLE_TYPES_RESET':
      return {
        ...state,
        searchableTypes: getSortedSearchableTypes(schema),
      }
    case 'SEARCHABLE_TYPES_SET':
      return {
        ...state,
        searchableTypes: getSortedSearchableTypes(schema, action.searchableTypes),
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
    case 'SORT_SET':
      return {
        ...state,
        sort: action.sort,
      }
    case 'SORT_RESET':
      return {
        ...state,
        sort: {
          mode: 'relevance',
          order: 'desc',
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
