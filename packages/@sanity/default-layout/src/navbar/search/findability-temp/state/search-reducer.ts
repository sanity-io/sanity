import {SearchTerms} from '@sanity/base'
import {ObjectSchemaType} from '@sanity/types'
import {SearchHit} from '../../types'
import {sortTypes} from '../utils/helpers'

export interface SearchReducerState {
  filtersVisible: boolean
  pageIndex: number
  result: SearchResult
  terms: SearchTerms
}

export interface SearchResult {
  error: Error | null
  hits: SearchHit[]
  loading: boolean
}

export const INITIAL_SEARCH_STATE: SearchReducerState = {
  filtersVisible: false,
  result: {
    hits: [],
    loading: false,
    error: null,
  },
  pageIndex: 0,
  terms: {
    query: '',
    types: [],
  },
}

export type FiltersHide = {type: 'FILTERS_HIDE'}
export type FiltersShow = {type: 'FILTERS_SHOW'}
export type FiltersToggle = {type: 'FILTERS_TOGGLE'}
export type PageIncrement = {type: 'PAGE_INCREMENT'}
export type ResultHitsAppend = {type: 'RESULT_HITS_APPEND'; hits: SearchHit[]}
export type ResultHitsClear = {type: 'RESULT_HITS_CLEAR'}
export type ResultSet = {type: 'RESULT_SET'; result: Partial<SearchResult>}
export type TermsQuerySet = {type: 'TERMS_QUERY_SET'; query: string}
export type TermsSet = {type: 'TERMS_SET'; terms: SearchTerms}
export type TypeAdd = {type: 'TYPE_ADD'; schemaType: ObjectSchemaType}
export type TypeRemove = {type: 'TYPE_REMOVE'; schemaType: ObjectSchemaType}
export type TypesClear = {type: 'TYPES_CLEAR'}

export type SearchAction =
  | FiltersHide
  | FiltersShow
  | FiltersToggle
  | PageIncrement
  | ResultHitsAppend
  | ResultHitsClear
  | ResultSet
  | TermsQuerySet
  | TermsSet
  | TypeAdd
  | TypeRemove
  | TypesClear

export function omnisearchReducer(
  state: SearchReducerState,
  action: SearchAction
): SearchReducerState {
  console.log('🔍', action)
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
    case 'RESULT_HITS_APPEND':
      return {
        ...state,
        result: {
          ...state.result,
          hits: [...state.result.hits, ...action.hits],
        },
      }
    case 'RESULT_HITS_CLEAR':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          hits: [],
        },
      }
    case 'RESULT_SET':
      return {
        ...state,
        result: {
          ...state.result,
          ...action.result,
        },
      }
    case 'TERMS_QUERY_SET':
      return {
        ...state,
        terms: {
          ...state.terms,
          query: action.query,
        },
      }
    case 'TERMS_SET':
      return {
        ...state,
        terms: action.terms,
      }
    case 'TYPE_ADD':
      return {
        ...state,
        terms: {
          ...state.terms,
          types: [...state.terms.types, action.schemaType].sort(sortTypes),
        },
      }
    case 'TYPE_REMOVE':
      return {
        ...state,
        terms: {
          ...state.terms,
          types: state.terms.types.filter((s) => s !== action.schemaType),
        },
      }
    case 'TYPES_CLEAR':
      return {
        ...state,
        terms: {
          ...state.terms,
          types: [],
        },
      }
    default:
      return state
  }
}
