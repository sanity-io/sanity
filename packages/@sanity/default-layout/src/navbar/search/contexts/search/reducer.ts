// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {SearchTerms} from '@sanity/base'
import type {ObjectSchemaType} from '@sanity/types'
import schema from 'part:@sanity/base/schema'
import {
  addSearchTerm,
  getRecentSearchTerms,
  RecentSearch,
  removeSearchTermAtIndex,
  removeSearchTerms,
} from '../../datastores/recentSearches'
import type {SearchHit} from '../../types'
import {debugWithName} from '../../utils/debug'
import {sortTypes} from './selectors'

export interface SearchReducerState {
  filtersVisible: boolean
  pageIndex: number
  recentSearches: RecentSearch[]
  result: SearchResult
  terms: SearchTerms
}

export interface SearchResult {
  error: Error | null
  hasMore?: boolean
  hits: SearchHit[]
  loaded: boolean
  loading: boolean
}

export const INITIAL_SEARCH_STATE: SearchReducerState = {
  filtersVisible: false,
  pageIndex: 0,
  recentSearches: getRecentSearchTerms(schema),
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

export type FiltersHide = {type: 'FILTERS_HIDE'}
export type FiltersShow = {type: 'FILTERS_SHOW'}
export type FiltersToggle = {type: 'FILTERS_TOGGLE'}
export type PageIncrement = {type: 'PAGE_INCREMENT'}
export type RecentSearchesAdd = {terms: SearchTerms; type: 'RECENT_SEARCHES_ADD'}
export type RecentSearchesRemoveAll = {type: 'RECENT_SEARCHES_REMOVE_ALL'}
export type RecentSearchesRemoveIndex = {index: number; type: 'RECENT_SEARCHES_REMOVE_INDEX'}
export type SearchClear = {type: 'SEARCH_CLEAR'}
export type SearchRequestComplete = {
  type: 'SEARCH_REQUEST_COMPLETE'
  hits: SearchHit[]
}
export type SearchRequestError = {type: 'SEARCH_REQUEST_ERROR'; error: Error}
export type SearchRequestStart = {type: 'SEARCH_REQUEST_START'}
export type TermsQuerySet = {type: 'TERMS_QUERY_SET'; query: string}
export type TermsSet = {type: 'TERMS_SET'; terms: SearchTerms}
export type TermsTypeAdd = {type: 'TERMS_TYPE_ADD'; schemaType: ObjectSchemaType}
export type TermsTypeRemove = {type: 'TERMS_TYPE_REMOVE'; schemaType: ObjectSchemaType}
export type TermsTypesClear = {type: 'TERMS_TYPES_CLEAR'}

export type SearchAction =
  | FiltersHide
  | FiltersShow
  | FiltersToggle
  | PageIncrement
  | RecentSearchesAdd
  | RecentSearchesRemoveAll
  | RecentSearchesRemoveIndex
  | SearchClear
  | SearchRequestComplete
  | SearchRequestError
  | SearchRequestStart
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
    case 'RECENT_SEARCHES_ADD':
      addSearchTerm(action.terms)
      return {
        ...state,
        recentSearches: getRecentSearchTerms(schema),
      }
    case 'RECENT_SEARCHES_REMOVE_ALL':
      removeSearchTerms()
      return {
        ...state,
        recentSearches: getRecentSearchTerms(schema),
      }
    case 'RECENT_SEARCHES_REMOVE_INDEX':
      removeSearchTermAtIndex(action.index)
      return {
        ...state,
        recentSearches: getRecentSearchTerms(schema),
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
